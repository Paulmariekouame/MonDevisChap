// État de l'application
let items = []
let images = {
  logo: null,
  image: null,
  signature: null,
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners()
  addItem()
})

// Gestion du thème
function initializeEventListeners() {
  document.getElementById("themeToggle").addEventListener("click", toggleTheme)
  document.getElementById("addLineBtn").addEventListener("click", addItem)
  document.getElementById("resetBtn").addEventListener("click", resetForm)
  document.getElementById("generatePdfBtn").addEventListener("click", generatePDF)
  document.getElementById("previewPdfBtn").addEventListener("click", () => generatePDF(true))
  document.getElementById("exportJsonBtn").addEventListener("click", exportJSON)
  document.getElementById("importJsonBtn").addEventListener("click", () => {
    document.getElementById("jsonFileInput").click()
  })
  document.getElementById("jsonFileInput").addEventListener("change", importJSON)

  // Upload d'images
  document.getElementById("logoUpload").addEventListener("change", (e) => handleImageUpload(e, "logo"))
  document.getElementById("imageUpload").addEventListener("change", (e) => handleImageUpload(e, "image"))
  document.getElementById("signatureUpload").addEventListener("change", (e) => handleImageUpload(e, "signature"))
}

function toggleTheme() {
  document.body.classList.toggle("dark")
}

// Gestion des images
function handleImageUpload(event, type) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      images[type] = e.target.result
      const preview = document.getElementById(`${type}Preview`)
      preview.innerHTML = `<img src="${e.target.result}" alt="${type}">`
    }
    reader.readAsDataURL(file)
  }
}

// Gestion des lignes de devis
function addItem() {
  const item = {
    id: Date.now(),
    description: "",
    quantity: 1,
    unitPrice: 0,
  }
  items.push(item)
  renderItems()
}

function deleteItem(id) {
  items = items.filter((item) => item.id !== id)
  renderItems()
}

function updateItem(id, field, value) {
  const item = items.find((i) => i.id === id)
  if (item) {
    item[field] = field === "description" ? value : Number.parseFloat(value) || 0
    renderItems()
  }
}

function renderItems() {
  const tbody = document.getElementById("itemsBody")
  tbody.innerHTML = ""

  items.forEach((item) => {
    const total = item.quantity * item.unitPrice
    const row = document.createElement("tr")
    row.innerHTML = `
            <td><input type="text" value="${item.description}" onchange="updateItem(${item.id}, 'description', this.value)"></td>
            <td><input type="number" value="${item.quantity}" min="1" onchange="updateItem(${item.id}, 'quantity', this.value)"></td>
            <td><input type="number" value="${item.unitPrice}" min="0" step="0.01" onchange="updateItem(${item.id}, 'unitPrice', this.value)"></td>
            <td>${formatCurrency(total)}</td>
            <td><button class="btn btn-danger" onclick="deleteItem(${item.id})">🗑️</button></td>
        `
    tbody.appendChild(row)
  })

  updateSummary()
}

function updateSummary() {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = subtotal * 0.2
  const total = subtotal + tax

  document.getElementById("subtotal").textContent = formatCurrency(subtotal)
  document.getElementById("tax").textContent = formatCurrency(tax)
  document.getElementById("total").textContent = formatCurrency(total)
}

function formatCurrency(amount) {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " FCFA"
  )
}

function resetForm() {
  if (confirm("Voulez-vous vraiment réinitialiser le formulaire ?")) {
    items = []
    images = { logo: null, image: null, signature: null }
    document.querySelectorAll("input").forEach((input) => {
      if (input.type !== "file") input.value = ""
    })
    document.querySelectorAll(".preview").forEach((preview) => (preview.innerHTML = ""))
    document.getElementById("templateSelect").value = "simple"
    renderItems()
    addItem()
  }
}

// Export/Import JSON
function exportJSON() {
  const data = {
    devisName: document.getElementById("devisName").value,
    template: document.getElementById("templateSelect").value,
    company: {
      name: document.getElementById("companyName").value,
      address: document.getElementById("companyAddress").value,
      phone: document.getElementById("companyPhone").value,
      email: document.getElementById("companyEmail").value,
    },
    client: {
      name: document.getElementById("clientName").value,
      address: document.getElementById("clientAddress").value,
      phone: document.getElementById("clientPhone").value,
      email: document.getElementById("clientEmail").value,
    },
    items: items,
    images: images,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `devis_${data.devisName || "export"}_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importJSON(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        document.getElementById("devisName").value = data.devisName || ""
        document.getElementById("templateSelect").value = data.template || "simple"
        document.getElementById("companyName").value = data.company.name || ""
        document.getElementById("companyAddress").value = data.company.address || ""
        document.getElementById("companyPhone").value = data.company.phone || ""
        document.getElementById("companyEmail").value = data.company.email || ""
        document.getElementById("clientName").value = data.client.name || ""
        document.getElementById("clientAddress").value = data.client.address || ""
        document.getElementById("clientPhone").value = data.client.phone || ""
        document.getElementById("clientEmail").value = data.client.email || ""
        items = data.items || []
        images = data.images || { logo: null, image: null, signature: null }

        // Mettre à jour les aperçus d'images
        ;["logo", "image", "signature"].forEach((type) => {
          if (images[type]) {
            const preview = document.getElementById(`${type}Preview`)
            preview.innerHTML = `<img src="${images[type]}" alt="${type}">`
          }
        })

        renderItems()
        alert("Données importées avec succès !")
      } catch (error) {
        alert("Erreur lors de l'importation du fichier JSON")
        console.error(error)
      }
    }
    reader.readAsText(file)
  }
}

// Génération PDF
async function generatePDF(preview = false) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  const devisName = document.getElementById("devisName").value || "Devis Sans Nom"
  const template = document.getElementById("templateSelect").value

  // Couleurs selon le modèle
  const colors = {
    simple: { primary: [0, 0, 0], secondary: [100, 100, 100] },
    moderne: { primary: [16, 185, 129], secondary: [59, 130, 246] },
    classique: { primary: [31, 41, 55], secondary: [75, 85, 99] },
  }

  const color = colors[template]
  let yPos = 20

  // En-tête avec logo
  if (images.logo) {
    try {
      doc.addImage(images.logo, "PNG", 15, yPos, 30, 30)
      yPos += 35
    } catch (e) {
      console.error("Erreur ajout logo:", e)
    }
  }

  // Titre du devis
  doc.setFontSize(24)
  doc.setTextColor(...color.primary)
  doc.text(devisName, 15, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 15, yPos)
  yPos += 15

  // Informations entreprise et client
  doc.setFontSize(12)
  doc.setTextColor(...color.primary)
  doc.text("Informations de l'entreprise", 15, yPos)
  doc.text("Informations du client", 110, yPos)
  yPos += 7

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const companyInfo = [
    document.getElementById("companyName").value,
    document.getElementById("companyAddress").value,
    document.getElementById("companyPhone").value,
    document.getElementById("companyEmail").value,
  ]

  const clientInfo = [
    document.getElementById("clientName").value,
    document.getElementById("clientAddress").value,
    document.getElementById("clientPhone").value,
    document.getElementById("clientEmail").value,
  ]

  companyInfo.forEach((info) => {
    if (info) {
      doc.text(info, 15, yPos)
      yPos += 5
    }
  })

  let clientYPos = yPos - companyInfo.filter((i) => i).length * 5
  clientInfo.forEach((info) => {
    if (info) {
      doc.text(info, 110, clientYPos)
      clientYPos += 5
    }
  })

  yPos = Math.max(yPos, clientYPos) + 10

  // Image supplémentaire
  if (images.image && template !== "simple") {
    try {
      doc.addImage(images.image, "PNG", 15, yPos, 60, 40)
      yPos += 45
    } catch (e) {
      console.error("Erreur ajout image:", e)
    }
  }

  // Tableau des articles
  doc.setFontSize(12)
  doc.setTextColor(...color.primary)
  doc.text("Détail des articles", 15, yPos)
  yPos += 7

  // En-tête du tableau
  doc.setFillColor(...color.primary)
  doc.rect(15, yPos, 180, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text("Description", 17, yPos + 5)
  doc.text("Qté", 120, yPos + 5)
  doc.text("Prix unit. (FCFA)", 140, yPos + 5)
  doc.text("Total (FCFA)", 175, yPos + 5)
  yPos += 10

  // Lignes du tableau
  doc.setTextColor(0, 0, 0)
  items.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }

    const total = item.quantity * item.unitPrice

    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(15, yPos - 5, 180, 8, "F")
    }

    doc.text(item.description || "-", 17, yPos)
    doc.text(item.quantity.toString(), 120, yPos)
    doc.text(formatNumber(item.unitPrice), 140, yPos)
    doc.text(formatNumber(total), 175, yPos)
    yPos += 8
  })

  yPos += 5

  // Totaux
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = subtotal * 0.2
  const total = subtotal + tax

  doc.setDrawColor(...color.secondary)
  doc.line(120, yPos, 195, yPos)
  yPos += 7

  doc.setFontSize(10)
  doc.text("Sous-total:", 120, yPos)
  doc.text(formatNumber(subtotal) + " FCFA", 175, yPos, { align: "right" })
  yPos += 6

  doc.text("Taxe (TVA 20%):", 120, yPos)
  doc.text(formatNumber(tax) + " FCFA", 175, yPos, { align: "right" })
  yPos += 8

  doc.setFontSize(12)
  doc.setTextColor(...color.primary)
  doc.text("TOTAL:", 120, yPos)
  doc.text(formatNumber(total) + " FCFA", 195, yPos, { align: "right" })
  yPos += 10

  // Signature
  if (images.signature) {
    yPos += 10
    try {
      doc.addImage(images.signature, "PNG", 140, yPos, 40, 20)
      yPos += 22
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text("Signature", 160, yPos, { align: "center" })
    } catch (e) {
      console.error("Erreur ajout signature:", e)
    }
  }

  if (preview) {
    window.open(doc.output("bloburl"), "_blank")
  } else {
    doc.save(`${devisName.replace(/\s+/g, "_")}_${Date.now()}.pdf`)
  }
}

function formatNumber(num) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

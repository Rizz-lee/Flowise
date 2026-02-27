const OCR_API_KEY = 'helloworld'

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  ;(async () => {
    if (request.action === 'translatePageText') {
      const translatedCount = await translatePageTextNodes()
      sendResponse({ message: `Translated ${translatedCount} text sections to English.` })
    }

    if (request.action === 'translateImageText') {
      const imageCount = await translateImageTextOverlays()
      sendResponse({ message: `Added English overlays to ${imageCount} image(s).` })
    }

    if (request.action === 'translateAll') {
      const translatedCount = await translatePageTextNodes()
      const imageCount = await translateImageTextOverlays()
      sendResponse({
        message: `Translated ${translatedCount} text sections and ${imageCount} image(s).`
      })
    }
  })().catch((error) => {
    console.error(error)
    sendResponse({ message: `Error: ${error.message}` })
  })

  return true
})

async function translatePageTextNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const candidates = []

  while (walker.nextNode()) {
    const node = walker.currentNode
    const text = node.nodeValue?.trim()
    if (!text || text.length < 2) continue

    const parent = node.parentElement
    if (!parent) continue

    const tag = parent.tagName
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'TEXTAREA'].includes(tag)) continue
    if (!isVisible(parent)) continue

    candidates.push(node)
  }

  let translatedCount = 0
  for (const node of candidates) {
    const original = node.nodeValue.trim()
    const translated = await translateToEnglish(original)
    if (translated && translated !== original) {
      node.nodeValue = node.nodeValue.replace(original, translated)
      translatedCount += 1
    }
  }

  return translatedCount
}

function isVisible(element) {
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

async function translateImageTextOverlays() {
  const images = Array.from(document.images).filter((img) => {
    const rect = img.getBoundingClientRect()
    return img.src && rect.width > 80 && rect.height > 80 && isVisible(img)
  })

  let processed = 0

  for (const img of images) {
    if (img.dataset.englishOverlayDone === 'true') continue

    try {
      const extractedText = await extractTextFromImageUrl(img.src)
      if (!extractedText?.trim()) continue

      const translated = await translateToEnglish(extractedText)
      if (!translated?.trim()) continue

      addOverlayToImage(img, translated)
      img.dataset.englishOverlayDone = 'true'
      processed += 1
    } catch (error) {
      console.warn('Image translation failed:', img.src, error)
    }
  }

  return processed
}

async function extractTextFromImageUrl(imageUrl) {
  const formData = new FormData()
  formData.append('apikey', OCR_API_KEY)
  formData.append('url', imageUrl)
  formData.append('language', 'eng')
  formData.append('isOverlayRequired', 'false')

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`OCR request failed (${response.status})`)
  }

  const result = await response.json()
  if (result?.IsErroredOnProcessing) {
    return ''
  }

  return result?.ParsedResults?.[0]?.ParsedText || ''
}

async function translateToEnglish(text) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: 'en',
    dt: 't',
    q: text
  })

  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`)
  if (!response.ok) {
    throw new Error(`Translation request failed (${response.status})`)
  }

  const payload = await response.json()
  const translated = payload?.[0]?.map((segment) => segment[0]).join('') || ''
  return translated.trim()
}

function addOverlayToImage(image, translatedText) {
  const wrapper = document.createElement('span')
  wrapper.style.position = 'relative'
  wrapper.style.display = 'inline-block'
  wrapper.style.maxWidth = `${image.width}px`

  image.parentNode.insertBefore(wrapper, image)
  wrapper.appendChild(image)

  const overlay = document.createElement('div')
  overlay.textContent = translatedText
  overlay.style.position = 'absolute'
  overlay.style.inset = '0'
  overlay.style.background = 'rgba(255, 255, 255, 0.9)'
  overlay.style.color = '#111'
  overlay.style.padding = '10px'
  overlay.style.fontSize = '14px'
  overlay.style.lineHeight = '1.4'
  overlay.style.overflow = 'auto'
  overlay.style.whiteSpace = 'pre-wrap'
  overlay.style.wordBreak = 'break-word'
  overlay.style.border = '1px solid rgba(0,0,0,0.12)'
  overlay.style.boxSizing = 'border-box'

  wrapper.appendChild(overlay)
}

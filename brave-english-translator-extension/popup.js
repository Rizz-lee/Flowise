async function sendAction(action) {
  const status = document.getElementById('status')
  status.textContent = 'Working...'

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    status.textContent = 'No active tab found.'
    return
  }

  chrome.tabs.sendMessage(tab.id, { action }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Could not connect to page. Refresh the tab and try again.'
      return
    }
    status.textContent = response?.message || 'Done.'
  })
}

document.getElementById('translateText').addEventListener('click', () => {
  sendAction('translatePageText')
})

document.getElementById('translateImages').addEventListener('click', () => {
  sendAction('translateImageText')
})

document.getElementById('translateAll').addEventListener('click', () => {
  sendAction('translateAll')
})

import { state } from '../store.js'
import { t } from '../utils/i18n.js'
import { openBottomSheet, closeBottomSheet, onSheetClose } from './BottomSheet.js'

const SKIN_TYPES = ['I', 'II', 'III', 'IV', 'V', 'VI']
const SKIN_BASE_MINS = [67, 100, 200, 300, 400, 600]

export function closeSpfSheet() {
  closeBottomSheet('spf-modal')
}

export function openSpfSheet() {
  const spfInfoContainer = document.getElementById('spf-info-container')
  if (!spfInfoContainer) return

  const uv = parseFloat(spfInfoContainer.dataset.uv || '0')

  const elUviBox = document.getElementById('spf-modal-uvi-box')
  const elUviTitle = document.getElementById('spf-modal-uvi-title')
  const elUviDesc = document.getElementById('spf-modal-uvi-desc')

  elUviBox.innerText = uv.toFixed(1)

  let riskStr, riskDesc, riskColor

  if (uv < 3) {
    riskStr = 'Bajo'; riskDesc = t('config.spfModalRiskLow'); riskColor = '#22c55e'
  } else if (uv < 6) {
    riskStr = 'Moderado'; riskDesc = t('config.spfModalRiskMod'); riskColor = '#eab308'
  } else if (uv < 8) {
    riskStr = 'Alto'; riskDesc = t('config.spfModalRiskHigh'); riskColor = '#f97316'
  } else if (uv < 11) {
    riskStr = 'Muy Alto'; riskDesc = t('config.spfModalRiskVHigh'); riskColor = '#ef4444'
  } else {
    riskStr = 'Extremo'; riskDesc = t('config.spfModalRiskExt'); riskColor = '#a855f7'
  }

  elUviBox.style.backgroundColor = riskColor
  elUviTitle.style.color = riskColor
  elUviTitle.innerText = `${t('config.spfModalTitleUVI')}: ${riskStr}`
  elUviDesc.innerText = riskDesc

  const sType = state.skinType || 2
  const timeToBurn = uv > 0 ? Math.round(SKIN_BASE_MINS[sType - 1] / uv) : 0
  document.getElementById('spf-modal-time-val').innerText = timeToBurn > 0 ? (timeToBurn > 120 ? '> 120' : String(timeToBurn)) : '--'
  document.getElementById('spf-modal-time-desc').innerText = `${t('config.spfModalTimeNone')} ${SKIN_TYPES[sType - 1] || 'II'}`

  let spfText
  if (uv >= 8) spfText = 'SPF 50+'
  else if (uv >= 6) spfText = 'SPF 50'
  else if (uv >= 3) spfText = 'SPF 30+'
  else if (uv > 0 && sType <= 2) spfText = 'SPF 15'
  else spfText = '--'

  document.getElementById('spf-modal-rec-val').innerText = spfText
  document.getElementById('spf-modal-rec-desc').innerText = t('config.spfModalReapply')

  openBottomSheet('spf-modal')
}

export function initSpfModal() {
  onSheetClose('spf-modal', closeSpfSheet)

  const spfInfoContainer = document.getElementById('spf-info-container')
  const spfModal = document.getElementById('spf-modal')
  if (!spfInfoContainer || !spfModal) return

  spfInfoContainer.addEventListener('click', openSpfSheet)

  const spfSettingsBtn = document.getElementById('spf-settings-btn')
  if (spfSettingsBtn) {
    spfSettingsBtn.addEventListener('click', () => {
      closeSpfSheet()
      openBottomSheet('info-modal', 'info-sheet-backdrop', 'info-sheet-content')
    })
  }
}

package com.microsoft.research.karya.ui.scenarios.speechData

import androidx.fragment.app.viewModels
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment

class SpeechDataMainFragment: BaseMTRendererFragment(R.layout.speech_data_main) {
  override fun setViewmodel() {
    val vm: SpeechDataMainViewModel by viewModels()
    viewmodel = vm
  }
}
package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.databinding.ActivitySplashScreenBinding
import com.microsoft.research.karya.utils.viewBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SplashScreenActivity : AppCompatActivity() {

  private val binding by viewBinding(ActivitySplashScreenBinding::inflate)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(binding.root)
  }
}

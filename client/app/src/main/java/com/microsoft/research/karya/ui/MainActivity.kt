package com.microsoft.research.karya.ui

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.databinding.ActivityMainBinding
import com.microsoft.research.karya.utils.extensions.viewBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
  private val binding by viewBinding(ActivityMainBinding::inflate)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(binding.root)
  }
}

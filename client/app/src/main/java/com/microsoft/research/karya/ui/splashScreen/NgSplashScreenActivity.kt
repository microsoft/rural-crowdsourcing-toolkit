package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.databinding.NgSplashScreenBinding
import com.microsoft.research.karya.utils.viewBinding

class NgSplashScreenActivity : AppCompatActivity() {

    private val binding by viewBinding(NgSplashScreenBinding::inflate)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(binding.root)
    }
}

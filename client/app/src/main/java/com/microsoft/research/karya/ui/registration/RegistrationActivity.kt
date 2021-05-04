package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.R
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class RegistrationActivity : AppCompatActivity() {
  /** Compute creation code text box length based on the creation code length */
  val current_assistant_audio = -1

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_registration)
  }
}

package com.microsoft.research.karya.ui.consentForm

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.text.Html
import android.text.method.ScrollingMovementMethod
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.ActivityConsentFormBinding
import com.microsoft.research.karya.ui.registration.CreationCodeActivity
import com.microsoft.research.karya.utils.viewBinding

class NgConsentFormActivity : AppCompatActivity() {

    private val binding by viewBinding(ActivityConsentFormBinding::inflate)

    // TODO: add assistant
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(binding.root)
        setupViews()
    }

    private fun setupViews() {
        val consentFormText = getString(R.string.s_consent_form_text)

        val spannedText = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Html.fromHtml(consentFormText, Html.FROM_HTML_MODE_COMPACT)
        } else {
            Html.fromHtml(consentFormText)
        }

        with(binding) {
            consentFormTv.text = spannedText
            consentFormTv.movementMethod = ScrollingMovementMethod()

            agreeBtn.setOnClickListener {
                startActivity(Intent(applicationContext, CreationCodeActivity::class.java))
                finish()
            }

            disagreeBtn.setOnClickListener {
                finish()
            }
        }
    }
}

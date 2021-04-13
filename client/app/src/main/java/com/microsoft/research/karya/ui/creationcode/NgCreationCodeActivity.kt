package com.microsoft.research.karya.ui.creationcode

import android.os.Bundle
import android.util.TypedValue
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.ActivityCreationCodeBinding
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import com.microsoft.research.karya.utils.viewBinding
import kotlinx.android.synthetic.main.activity_creation_code.*
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus

class NgCreationCodeActivity : AppCompatActivity() {

    private val binding by viewBinding(ActivityCreationCodeBinding::inflate)
    private val CREATION_CODE_LENGTH = 16
    private val creationCodeEtMax = CREATION_CODE_LENGTH + (CREATION_CODE_LENGTH - 1) / 4


    // TODO: add assistant
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(binding.root)
        setupViews()
    }

    private fun setupViews() {
        with(binding) {
            phantomCCTv.addOnLayoutChangeListener { _: View, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int ->
                creationCodeEt.setTextSize(TypedValue.COMPLEX_UNIT_PX, phantomCCTv.textSize)
            }

            /** Add text change listener to creation code */
            creationCodeEt.addTextChangedListener(object : SeparatorTextWatcher('-', 4) {
                override fun onAfterTextChanged(text: String, position: Int) {
                    creationCodeEt.run {
                        setText(text)
                        setSelection(position)
                    }

                    /** If creation code length has reached max, call handler */
                    if (creationCodeEt.length() == creationCodeEtMax) {
                        // TODO: call this once the user presses the button to move forward.
                        handleFullCreationCode()
                    } else {
                        clearErrorMessages()
                    }
                }
            })
            requestSoftKeyFocus(creationCodeEt)
        }
    }

    private fun handleFullCreationCode() {
        creationCodeEt.isEnabled = false
        val creationCode = creationCodeEt.text.toString().replace("-", "")
        // verifyCreationCode(creationCode)
    }

    private fun clearErrorMessages() {
        creationCodeErrorTv.text = ""
        creationCodeStatusIv.setImageResource(0)
        creationCodeStatusIv.setImageResource(R.drawable.ic_check_grey)
    }
}

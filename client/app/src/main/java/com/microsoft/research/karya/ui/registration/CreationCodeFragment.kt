package com.microsoft.research.karya.ui.registration

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.util.TypedValue
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.service.KaryaAPIService
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import kotlinx.android.synthetic.main.fragment_creation_code.*
import kotlinx.android.synthetic.main.fragment_creation_code.view.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

/**
 * A simple [Fragment] subclass.
 * Use the [CreationCodeFragment.newInstance] factory method to
 * create an instance of this fragment.
 */


private const val CREATION_CODE_LENGTH = 16

class CreationCodeFragment : Fragment() {

    /** Compute creation code text box length based on the creation code length */
    private val creationCodeEtMax = CREATION_CODE_LENGTH + (CREATION_CODE_LENGTH - 1) / 4

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity
    private lateinit var karyaAPI: KaryaAPIService

    protected val ioScope = CoroutineScope(Dispatchers.IO)
    protected val uiScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity
        karyaAPI = baseActivity.karyaAPI

        /** Initialising Strings  **/
        // TODO: Remove this implementation when we fetch strings from resource
        // This Initialisation is only needed to be done once for the first fragment
        baseActivity.initialise()

        /** Inflating the layout for this fragment **/
        val fragmentView = inflater.inflate(R.layout.fragment_creation_code, container, false)

        /**
         * Set all initial UI strings
         */
        fragmentView.creationCodePromptTv.text = registrationActivity.accessCodePromptMessage

        return fragmentView
    }


    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_access_code_prompt

        /** Set the creation code font size to the same value as the phantom text view font size */
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
                    handleFullCreationCode()
                } else {
                    clearErrorMessages()
                }
            }
        })
        (activity as BaseActivity).requestSoftKeyFocus(creationCodeEt)
    }

    private fun handleFullCreationCode() {
        creationCodeEt.isEnabled = false
        val creationCode = creationCodeEt.text.toString().replace("-", "")
        verifyCreationCode(creationCode)
    }

    private fun clearErrorMessages() {
        creationCodeErrorTv.text = ""
        creationCodeStatusIv.setImageResource(0)
        creationCodeStatusIv.setImageResource(R.drawable.ic_check_grey)
    }

    /**
     * Verify creation code. Send request to server. If successful, then move to the next activity.
     * Else set the error message appropriately.
     */
    private fun verifyCreationCode(creationCode: String) {

        ioScope.launch {
            val callForCreationCodeCheck = karyaAPI.checkCreationCode(creationCode)
            if (callForCreationCodeCheck.isSuccessful) {
                val response = callForCreationCodeCheck.body()!!

                // Valid creation code
                if (response.valid) {
                    uiScope.launch {
                        creationCodeStatusIv.setImageResource(0)
                        creationCodeStatusIv.setImageResource(R.drawable.ic_baseline_check_circle_outline_24)
                        WorkerInformation.creation_code = creationCode
                        findNavController().navigate(R.id.action_creationCodeFragment_to_phoneNumberFragment)
                    }
                } else {
                    uiScope.launch {
                        creationCodeErrorTv.text = when (response.message) {
                            "invalid_creation_code" -> registrationActivity.invalidCreationCodeMessage
                            "creation_code_already_used" -> registrationActivity.creationCodeAlreadyUsedMessage
                            else -> "unknown error occurred"
                        }
                        creationCodeStatusIv.setImageResource(0)
                        creationCodeStatusIv.setImageResource(R.drawable.ic_quit_select)
                        creationCodeEt.isEnabled = true
                        baseActivity.requestSoftKeyFocus(creationCodeEt)
                    }
                }
            }
        }
    }

}

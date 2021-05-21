// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.scenarios.textToTextTranslation

import android.annotation.SuppressLint
import android.graphics.Color
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.WindowManager
import android.widget.*
import com.microsoft.inmt_lite.INMTLiteDropDown
import com.google.gson.JsonObject
import com.microsoft.inmtbow.INMTLiteBagOfWords
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.MicrotaskRenderer
import kotlinx.android.synthetic.main.microtask_speech_verification.*
import kotlinx.android.synthetic.main.microtask_text_translation_dropdown.*
import kotlinx.android.synthetic.main.microtask_text_translation_dropdown.nextBtnDropdown
import kotlinx.android.synthetic.main.microtask_text_translation_bagofwords.*
import kotlinx.android.synthetic.main.microtask_text_translation_bagofwords.nextBtnBOW
import kotlinx.android.synthetic.main.microtask_text_translation_none.*
import kotlinx.android.synthetic.main.microtask_text_translation_none.nextBtnNone
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class TextToTextTranslationMain : MicrotaskRenderer(
    activityName = "TEXT_TO_TEXT_TRANSLATION",
    includeCompleted = false,
    finishOnGroupBoundary = false
) {
    var support: String = "none"
    var onlineMode = false
    var nWords = 2
    var bagOfWords = ""
    var bagOfWordsCount = 0
    var sourceLanguage = "English"
    var targetLanguage = "Hindi"
    var langspec = "en-hi"
    var microTaskStartTime: Long = 0
    private lateinit var editText: EditText

    /**
     * UI button states
     */
    private enum class ButtonState {
        DISABLED,
        ENABLED
    }

    /**
     * Setup the view for the microtask renderer. Called at the end of the [onCreate]. This
     * function can also be used to extract specific objects in the views.
     */

    private var nextBtnDropDownState: ButtonState =
        ButtonState.DISABLED
    private var nextBtnBOWState: ButtonState =
        ButtonState.DISABLED
    private var nextBtnNoneState: ButtonState =
        ButtonState.DISABLED


    override fun setupActivity() {
        val instruction = task.params.asJsonObject.get("instruction").asString
        support = task.params.asJsonObject.get("mode").asString
        //support is bow\dd1\dd2\none\gt
        when (support) {
            "bow" -> {
                /** Setup view */
                setContentView(R.layout.microtask_text_translation_bagofwords)
                instructionTvbow.text = instruction
                this.getWindow().setSoftInputMode(WindowManager.LayoutParams. SOFT_INPUT_ADJUST_NOTHING);
                /** Set on click listeners for buttons */
                val textBagOfWords = findViewById<INMTLiteBagOfWords>(R.id.textTranslationBOW)
                textTranslationBOW.setLogging(::setLog)
                editText = getEditText()
                val editTextParams = getEditTextParams()
                editText!!.layoutParams = editTextParams
                textBagOfWords.setupINMTBagOfWords(editText, editTextParams)

                nextBtnBOW.setOnClickListener { handleNextClick() }
                setButtonStates(ButtonState.DISABLED)
            }
            "dd1", "dd2" -> {
                /** Setup view */
                setContentView(R.layout.microtask_text_translation_dropdown)
                instructionTvdd.text = instruction
                /** Set on click listeners for buttons */
                textTranslationDropdown.setLogging(::setLog)
                nextBtnDropdown.setOnClickListener { handleNextClick() }
                handleTextChange()
                setButtonStates(ButtonState.DISABLED)
            }

            else -> {
                setContentView(R.layout.microtask_text_translation_none)
                nextBtnNone.setOnClickListener { handleNextClick() }
                handleTextChange()
                setButtonStates(ButtonState.DISABLED)
            }
        }

    }

    /**
     * Cleanup function called during [onStop].
     */
    override fun cleanupOnStop() = Unit

    /**
     * Reset activity on restart. Called during [onRestart]
     */
    override fun resetOnRestart() = Unit

    /**
     * Setup microtask after updating [currentAssignmentIndex]. Called at the end of [onResume], and
     * navigating to next or previous tasks
     */
    override fun setupMicrotask() {
        microTaskStartTime = System.nanoTime()
        var srcSentence: String =
            currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").asString

        when (support) {
            "bow" -> {
                log(srcSentence)
                sourceSentenceBOW.text = srcSentence

                bagOfWords = currentMicroTask.input.asJsonObject.getAsJsonObject("data").asJsonObject.get("bow").asString

                val textBagOfWords = findViewById<INMTLiteBagOfWords>(R.id.textTranslationBOW)


                handleTextChange()
                GlobalScope.launch(Dispatchers.Main) {
                    textBagOfWords.resetINMTBagOfWords(
                        srcSentence,
                        bagOfWords,
                        onlineMode,
                        langspec
                    )
                }
            }

            "dd1", "dd2" -> {

                val textToTextTranslation =
                    findViewById<INMTLiteDropDown>(R.id.textTranslationDropdown)
                sourceSentenceDropDown.text = srcSentence
                textTranslationDropdown.setText("")
                if (support == "dd2")
                    nWords = 2
                textToTextTranslation.resetINMTLiteDropdown(
                    srcSentence,
                    sourceLanguage,
                    targetLanguage,
                    langspec,
                    nWords
                )
            }
            else -> {
                sourceSentenceNone.text = srcSentence
                textTranslationNone.setText("")
            }


        }
    }


    private fun setLog(message: String) {
        log(message)
    }

    /**
     * Handle next button click
     */
    private fun handleNextClick() {

        /** Log button press */
        val message = JsonObject()
        message.addProperty("type", "o")
        message.addProperty("button", "NEXT")
        log(message)

        /*Time taken to complete the microtask*/
        var microTaskTimeTaken = (System.nanoTime() - microTaskStartTime) / 1000000
        log("MicroTask completion time in ms:$microTaskTimeTaken")

        when (support) {
            "bow" -> {
                log("Total clicks in bow:$bagOfWordsCount")
                outputData.addProperty("sentence", editText.getText().toString())
                val textBagOfWords = findViewById<INMTLiteBagOfWords>(R.id.textTranslationBOW)
                setButtonStates(ButtonState.DISABLED)
                bagOfWordsCount = 0
                textBagOfWords.clearINMTBOW()
            }
            "dd1", "dd2" -> {
                outputData.addProperty(
                    "sentence",
                    textTranslationDropdown.getText().toString()
                )
                val textDropDown = findViewById<INMTLiteDropDown>(R.id.textTranslationDropdown)
                textDropDown.clearINMTDropDown()
                textTranslationDropdown.setText("")
                setButtonStates(ButtonState.DISABLED)
            }
            else -> {
                outputData.addProperty("sentence", textTranslationNone.getText().toString())
                setButtonStates(ButtonState.DISABLED)
            }
        }


        ioScope.launch {
            completeAndSaveCurrentMicrotask()
            moveToNextMicrotask()
        }
    }

    /**
     * Set button states
     */
    private fun setButtonStates(
        nextState: ButtonState
    ) {
        when (support) {
            "bow" -> nextBtnBOWState = nextState
            "dd1", "dd2" -> nextBtnDropDownState = nextState
            else -> nextBtnNoneState = nextState
        }
        flushButtonStates()
    }

    private fun flushButtonStates() {
        when (support) {
            "bow" -> {
                nextBtnBOW.isClickable =
                    nextBtnBOWState != ButtonState.DISABLED

                nextBtnBOW.setBackgroundResource(
                    when (nextBtnBOWState) {
                        ButtonState.DISABLED -> R.drawable.ic_next_disabled
                        ButtonState.ENABLED -> R.drawable.ic_next_enabled
                    }
                )

            }
            "dd1", "dd2" -> {
                nextBtnDropdown.isClickable =
                    nextBtnDropDownState != ButtonState.DISABLED

                nextBtnDropdown.setBackgroundResource(
                    when (nextBtnDropDownState) {
                        ButtonState.DISABLED -> R.drawable.ic_next_disabled
                        ButtonState.ENABLED -> R.drawable.ic_next_enabled
                    }
                )
            }
            else -> {
                nextBtnNone.isClickable =
                    nextBtnNoneState != ButtonState.DISABLED

                nextBtnNone.setBackgroundResource(
                    when (nextBtnNoneState) {
                        ButtonState.DISABLED -> R.drawable.ic_next_disabled
                        ButtonState.ENABLED -> R.drawable.ic_next_enabled
                    }
                )
            }
        }
    }


    private fun getEditText(): EditText {
        editText = EditText(this)
        editText!!.hint = "Type your translation here"
        editText!!.maxLines = 4
        editText!!.setText("")
        editText!!.setPadding(30, 30, 30, 30)
        editText!!.setTextColor(Color.parseColor("#000000"))
        editText!!.setBackgroundResource(R.drawable.border_black)

        return editText
    }

    private fun getEditTextParams(): LinearLayout.LayoutParams {
        val editTextParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        editTextParams.setMargins(35, 20, 35, 20)
        return editTextParams
    }

    private fun handleTextChange() {
        when (support) {
            "bow" -> {
                editText.addTextChangedListener(object : TextWatcher {
                    override fun beforeTextChanged(
                        charSequence: CharSequence,
                        i: Int,
                        i1: Int,
                        i2: Int
                    ) {
                    }

                    override fun onTextChanged(
                        charSequence: CharSequence,
                        i1: Int,
                        i2: Int,
                        i3: Int
                    ) {
                    }

                    override fun afterTextChanged(s: Editable) {
                        bagOfWordsCount += 1
                        if (editText.text.toString() != "") {
                            setButtonStates(ButtonState.ENABLED)
                        } else {
                            setButtonStates(ButtonState.DISABLED)
                        }
                    }
                })

            }
            "dd1", "dd2" -> {
                textTranslationDropdown.addTextChangedListener(object : TextWatcher {
                    override fun beforeTextChanged(
                        charSequence: CharSequence,
                        i: Int,
                        i1: Int,
                        i2: Int
                    ) {
                    }

                    override fun onTextChanged(
                        charSequence: CharSequence,
                        i1: Int,
                        i2: Int,
                        i3: Int
                    ) {
                    }

                    override fun afterTextChanged(s: Editable) {
                        if (textTranslationDropdown.text.toString() != "") {
                            setButtonStates(ButtonState.ENABLED)
                        } else {
                            setButtonStates(ButtonState.DISABLED)
                        }
                    }
                })
            }
            else -> {
                textTranslationNone.addTextChangedListener(object : TextWatcher {
                    override fun beforeTextChanged(
                        charSequence: CharSequence,
                        i: Int,
                        i1: Int,
                        i2: Int
                    ) {
                    }

                    override fun onTextChanged(
                        charSequence: CharSequence,
                        i1: Int,
                        i2: Int,
                        i3: Int
                    ) {
                    }

                    override fun afterTextChanged(s: Editable) {
                        if (textTranslationNone.text.toString() != "") {
                            setButtonStates(ButtonState.ENABLED)
                        } else {
                            setButtonStates(ButtonState.DISABLED)
                        }
                    }
                })
            }
        }
    }
}

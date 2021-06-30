// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.scenarios.textToTextTranslation

import android.graphics.Color
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.WindowManager
import android.widget.EditText
import android.widget.LinearLayout
import com.google.gson.JsonObject
import com.microsoft.inmt_lite.INMTLiteDropDown
import com.microsoft.inmtbow.INMTLiteBagOfWords
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.MicrotaskRenderer
import kotlinx.android.synthetic.main.microtask_text_translation_bagofwords.*
import kotlinx.android.synthetic.main.microtask_text_translation_dropdown.*
import kotlinx.android.synthetic.main.microtask_text_translation_none.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class TextToTextTranslationMain : MicrotaskRenderer(
    activityName = "TEXT_TO_TEXT_TRANSLATION",
    includeCompleted = false,
    finishOnGroupBoundary = false
) {
    var support: String = "none"
    var onlineMode = true
    var nWords = 2
    var bagOfWords = ""
    var bagOfWordsCount = 0
    var sourceLanguage = "English"
    var targetLanguage = "Hindi"
    var langspec = "en-hi"
    var microTaskStartTime: Long = 0
    var prevSentence = ""
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
        val message = JsonObject()
        message.addProperty("type", "i")
        message.addProperty("input", "Activity started")
        log(message)
        val instruction = task.params.asJsonObject.get("instruction").asString
        support = task.params.asJsonObject.get("mode").asString
        microTaskStartTime = System.nanoTime()

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
                bagOfWordsCount = 0
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
                dropDownCount = 0
                /** Set on click listeners for buttons */
                textTranslationDropdown.setLogging(::setLog)
                textTranslationDropdown.setText("")
                textTranslationDropdown.setupINMTDropDown()
                nextBtnDropdown.setOnClickListener { handleNextClick() }
                handleTextChange()
                setButtonStates(ButtonState.DISABLED)
            }

            else -> {
                setContentView(R.layout.microtask_text_translation_none)
                instructionTvnone.text = instruction
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
        var srcSentence: String =
            currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").asString

        val message = JsonObject()
        message.addProperty("type", "i")
        message.addProperty("input", "MicroTask enabled $support")
        log(message)

        when (support) {
            "bow" -> {
                log(srcSentence)
                sourceSentenceBOW.text = srcSentence
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
                bagOfWords = currentMicroTask.input.asJsonObject.getAsJsonObject("data").asJsonObject.get("bow").asString
                val textBagOfWords = findViewById<INMTLiteBagOfWords>(R.id.textTranslationBOW)
<<<<<<< Updated upstream


                handleTextChange()
                GlobalScope.launch(Dispatchers.Main) {
                    textBagOfWords.resetINMTBagOfWords(
                        srcSentence,
                        bagOfWords,
                        onlineMode,
                        langspec
                    )
=======
                if(prevSentence != srcSentence) {
                    prevSentence = srcSentence
                    val bagOfWordsArray: Array<String> = bagOfWords.split(" ").toTypedArray()
                    GlobalScope.launch(Dispatchers.Main) {
                        textBagOfWords.setupTranslationTask(
                            srcSentence,
                            bagOfWordsArray,
                            false
                        )
                    }
>>>>>>> Stashed changes
                }
            }

            "dd1", "dd2" -> {

                val textToTextTranslation =
                    findViewById<INMTLiteDropDown>(R.id.textTranslationDropdown)
                sourceSentenceDropDown.text = srcSentence
<<<<<<< Updated upstream
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
=======

                if (support == "dd2")
                    nWords = 2
                if(prevSentence != srcSentence) {
                    prevSentence = srcSentence
                    textToTextTranslation.setupTranslationTask(
                        srcSentence,
                        sourceLanguage,
                        targetLanguage,
                        langspec,
                        nWords,
                        onlineMode
                    )
                }
>>>>>>> Stashed changes
            }
            else -> {
                sourceSentenceNone.text = srcSentence
            }


        }
    }


    private fun setLog(message: String) {
        log(message)
        Log.i("message", message)
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
        Log.i("msg","MicroTask completion time in ms:$microTaskTimeTaken")


        when (support) {
            "bow" -> {
                log("Total keystrokes in bow:$bagOfWordsCount")
                outputData.addProperty("sentence", editText.getText().toString())
                val textBagOfWords = findViewById<INMTLiteBagOfWords>(R.id.textTranslationBOW)
                editText.setText("")
                bagOfWordsCount = 0
                setButtonStates(ButtonState.DISABLED)
<<<<<<< Updated upstream
                bagOfWordsCount = 0
                textBagOfWords.clearINMTBOW()
            }
            "dd1", "dd2" -> {
=======
                log("Button Clicks:" + textBagOfWords.returnButtonClicks())
            }
            "dd1", "dd2" -> {
                log("Total keystrokes in dd:$dropDownCount")
                Log.i("message", "Total clicks in dd:$dropDownCount")
>>>>>>> Stashed changes
                outputData.addProperty(
                    "sentence",
                    textTranslationDropdown.getText().toString()
                )
                val textDropDown = findViewById<INMTLiteDropDown>(R.id.textTranslationDropdown)
                textTranslationDropdown.setText("")
                textDropDown.updateLogs()
                dropDownCount = 0
                setButtonStates(ButtonState.DISABLED)
            }
            else -> {
                outputData.addProperty("sentence", textTranslationNone.getText().toString())
                textTranslationNone.setText("")
                setButtonStates(ButtonState.DISABLED)
            }
        }

        microTaskStartTime = System.nanoTime()
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
        /*Set the parameters for edittext, used for BOW*/
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
        /*Log the number of characters changed
        * Sets the next button state as active after a character has been typed*/
        when (support) {
            "bow" -> {
                editText.addTextChangedListener(object : TextWatcher {
                    var previousText:String = ""
                    override fun beforeTextChanged(
                        charSequence: CharSequence,
                        i: Int,
                        i1: Int,
                        i2: Int
                    ) {
                    }

                    override fun onTextChanged(
                        newText: CharSequence,
                        i1: Int,
                        i2: Int,
                        i3: Int
                    ) {
                        if(newText.length > previousText.length){
                            log("Text added: " + (newText.length - previousText.length))
                            Log.i("textchange","Text added: " + (newText.length - previousText.length))
                        }
                        else{
                            log("Text removed: " + (previousText.length - newText.length))
                            Log.i("textchange","Text removed: " + (previousText.length - newText.length))
                        }
                        previousText = newText.toString()
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
                    var previousText:String = ""
                    override fun beforeTextChanged(
                        charSequence: CharSequence,
                        i: Int,
                        i1: Int,
                        i2: Int
                    ) {
                    }

                    override fun onTextChanged(
                        newText: CharSequence,
                        i1: Int,
                        i2: Int,
                        i3: Int
                    ) {
                        if(newText.length > previousText.length){
                            log("Text added: " + (newText.length - previousText.length))
                            Log.i("textchange","Text added: " + (newText.length - previousText.length))
                        }
                        else{
                            log("Text removed: " + (previousText.length - newText.length))
                            Log.i("textchange","Text removed: " + (previousText.length - newText.length))
                        }
                        previousText = newText.toString()
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
                    var previousText:String = ""
                    override fun beforeTextChanged(
                        charSequence: CharSequence,
                        i: Int,
                        i1: Int,
                        i2: Int
                    ) {
                    }

                    override fun onTextChanged(
                        newText: CharSequence,
                        i1: Int,
                        i2: Int,
                        i3: Int
                    ) {
                        if(newText.length > previousText.length){
                            log("Text added: " + (newText.length - previousText.length))
                        }
                        else{
                            log("Text removed: " + (previousText.length - newText.length))
                        }
                        previousText = newText.toString()
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

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Custom numeric pad with a done button


package com.microsoft.research.karya.ui.views.numpad

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.EditText
import android.widget.FrameLayout
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.NumpadBinding

class NumPad : FrameLayout {

  constructor(context: Context) : super(context)
  constructor(context: Context, attrs: AttributeSet) : super(context, attrs, 0) {
    initAttributes(context, attrs, -1)
  }

  constructor(context: Context, attrs: AttributeSet, defStyleAttr: Int) : super(
    context,
    attrs,
    defStyleAttr
  ) {
    initAttributes(context, attrs, defStyleAttr)
  }

  private var fieldId: Int = 0
  private lateinit var binding: NumpadBinding
  private var doneButtonState: Boolean = false
  private lateinit var onDoneListener: OnClickListener

  /**
   * Reference to the text field
   */
  private var field: EditText? = null
    set(value) {
      field = value
      field?.showSoftInputOnFocus = false
    }

  /**
   * Max length of the text
   */
  private var maxLength: Int = 0

  /**
   * Initialize the attributes
   */
  private fun initAttributes(context: Context, attrs: AttributeSet, defStyleAttr: Int) {
    val attributes =
      context.theme.obtainStyledAttributes(attrs, R.styleable.NumPad, defStyleAttr, 0)
    fieldId = attributes.getResourceId(R.styleable.NumPad_field, 0)
    maxLength = attributes.getInteger(R.styleable.NumPad_maxLength, 0)
    post { initViews() }
  }

  /**
   * Initialize views
   */
  private fun initViews() {
    if (field == null) {
      field = rootView.findViewById(fieldId)
    }

    // Get view binding
    val inflater = LayoutInflater.from(context)
    val layout = inflater.inflate(R.layout.numpad, this, false)
    binding = NumpadBinding.bind(layout)

    // Set on-click listeners
    binding.key0.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '0'))
    binding.key1.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '1'))
    binding.key2.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '2'))
    binding.key3.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '3'))
    binding.key4.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '4'))
    binding.key5.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '5'))
    binding.key6.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '6'))
    binding.key7.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '7'))
    binding.key8.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '8'))
    binding.key9.setOnClickListener(ClickListener(field, maxLength, KeyType.DIGIT, '9'))
    binding.keyDelete.setOnClickListener(ClickListener(field, maxLength, KeyType.DELETE, '0'))

    if (::onDoneListener.isInitialized) {
      binding.keyDone.setOnClickListener(onDoneListener)
    }
    binding.keyDone.isClickable = doneButtonState

    addView(layout)
  }

  /**
   * Enable done
   */
  fun enableDoneButton() {
    doneButtonState = true
    if (::binding.isInitialized) {
      binding.keyDone.isClickable = true
    }
  }

  /**
   * Disable done
   */
  fun disableDoneButton() {
    doneButtonState = false
    if (::binding.isInitialized) {
      binding.keyDone.isClickable = false
    }
  }

  /**
   * Listener for done
   */
  fun setOnDoneListener(listener: OnClickListener) {
    if (::binding.isInitialized) {
      binding.keyDone.setOnClickListener(listener)
    } else {
      onDoneListener = listener
    }
  }
}
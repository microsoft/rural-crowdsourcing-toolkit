package com.microsoft.research.karya.ui.scenarios.signVideo

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.microsoft.research.karya.R

class SignVideoRecord : Fragment() {


  override fun onCreateView(
    inflater: LayoutInflater, container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    // Inflate the layout for this fragment
    return inflater.inflate(R.layout.fragment_sign_video_record, container, false)
  }
}
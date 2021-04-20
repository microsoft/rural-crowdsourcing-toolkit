package com.microsoft.research.karya.ui.accesscode

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.R
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class AccessCodeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_access_code)
    }

}

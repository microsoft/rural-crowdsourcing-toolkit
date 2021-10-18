package com.microsoft.research.karya.utils.extensions

import android.app.Activity
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import androidx.core.content.getSystemService
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

val Fragment.viewLifecycle
  get() = viewLifecycleOwner.lifecycle

val Fragment.viewLifecycleScope
  get() = viewLifecycleOwner.lifecycleScope

/** Request focus on a text field and show the keyboard */
fun Activity.requestSoftKeyFocus(editText: EditText) {
  editText.requestFocus()
  val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
  imm.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
}

fun Activity.hideKeyboard() {
  val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
  val view = currentFocus ?: View(this)
  imm.hideSoftInputFromWindow(view.windowToken, 0)
}

fun Fragment.requestSoftKeyFocus(editText: EditText) {
  editText.requestFocus()
  val imm = requireActivity().getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
  imm.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
}

fun Fragment.hideKeyboard() {
  val imm = requireActivity().getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
  val view = requireActivity().currentFocus ?: View(requireContext())
  imm.hideSoftInputFromWindow(view.windowToken, 0)
}

fun Fragment.finish() = requireActivity().finish()

fun Context.getDirectory(directoryName: String): String =
  getDir(directoryName, Context.MODE_PRIVATE).path

fun Context.isNetworkAvailable(): Boolean {
  val connectivityManager = getSystemService<ConnectivityManager>()
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    val activeNetwork = connectivityManager?.activeNetwork ?: return false
    val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
    return when {
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> true
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> true
      // for other device how are able to connect with Ethernet
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> true
      // for check internet over Bluetooth
      capabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) -> true
      else -> false
    }
  } else {
    val activeNetworkInfo = connectivityManager?.activeNetworkInfo ?: return false
    return activeNetworkInfo.isConnected
  }
}

import android.app.Activity
import android.content.Context
import android.view.inputmethod.InputMethodManager
import android.widget.EditText

/**
 * Request focus on a text field and show the keyboard
 */
internal fun Activity.requestSoftKeyFocus(eT: EditText) {
    eT.requestFocus()
    val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    imm.showSoftInput(eT, InputMethodManager.SHOW_IMPLICIT)
}

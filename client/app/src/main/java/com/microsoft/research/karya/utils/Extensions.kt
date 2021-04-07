import android.app.Activity
import android.content.Context
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore

/**
 * Request focus on a text field and show the keyboard
 */
internal fun Activity.requestSoftKeyFocus(eT: EditText) {
    eT.requestFocus()
    val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
    imm.showSoftInput(eT, InputMethodManager.SHOW_IMPLICIT)
}

internal val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

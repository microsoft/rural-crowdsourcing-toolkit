import Versions.room_version

object Versions{

    val kotlin_version = "1.3.41"
    val room_version = "2.2.6"
    val coroutines_version = "1.3.9"
    val lifecycle_version = "2.3.0"

    val multidex_version = "2.0.1"
    val lifecycle_extention_version = "2.2.0"
    val work_runtime_version = "2.5.0"

    val appcompat = "1.2.0"
    val material_design_version = "1.3.0"
    val constraint_layout_version = "2.0.4"
    val legacy_support_version = "1.0.0"
    val glide_version = "4.11.0"
    val recycelerview_version = "1.0.0"
    val state_progressbar_version = "1.0.0"

    val retrofit_version = "2.9.0"
    val gson_version = "2.8.6"
    val okhttp_version = "3.14.9"
    val okhttpGson_version = "2.9.0"

    val crashlytics_version = "17.4.0"
    val analytics_version = "18.0.2"

    val debug_db_version = "1.0.6"


    val play_core_version = "1.8.0"
}

object kotlinDependencies {
    val kotlin = "org.jetbrains.kotlin:kotlin-stdlib-jdk7:${Versions.kotlin_version}"
    val coroutines = "org.jetbrains.kotlinx:kotlinx-coroutines-android:${Versions.coroutines_version}"
    val coroutine_core = "org.jetbrains.kotlinx:kotlinx-coroutines-core:${Versions.coroutines_version}"
}

object viewmodelDependencies {
    val viewmodel = "androidx.lifecycle:lifecycle-viewmodel-ktx:${Versions.lifecycle_version}"
    val livedata = "androidx.lifecycle:lifecycle-livedata-ktx:${Versions.lifecycle_version}"
    val lifecycle_runtime = "androidx.lifecycle:lifecycle-runtime-ktx:${Versions.lifecycle_version}"
    val saved_state_viewModel = "androidx.lifecycle:lifecycle-viewmodel-savedstate:${Versions.lifecycle_version}"
    val multidex = "androidx.multidex:multidex:${Versions.multidex_version}"
    val lifecycle_extension = "androidx.lifecycle:lifecycle-extensions:${Versions.lifecycle_extention_version}"
    val work_runtime = "androidx.work:work-runtime-ktx:${Versions.work_runtime_version}"
}

object uiDependencies {
    val material_design = "com.google.android.material:material:${Versions.material_design_version}"
    val appcaompat = "androidx.appcompat:appcompat:${Versions.appcompat}"
    val constraintlayout = "androidx.constraintlayout:constraintlayout:${Versions.constraint_layout_version}"
    val legacy_support = "androidx.legacy:legacy-support-v4:${Versions.legacy_support_version}"
    val glide = "com.github.bumptech.glide:glide:${Versions.glide_version}"
    val stateprogressbar = "com.kofigyan.stateprogressbar:stateprogressbar:${Versions.state_progressbar_version}"
}

object networkDependencies {
    val okhttp = "com.squareup.okhttp3:okhttp:${Versions.okhttp_version}"
    val retrofit = "com.squareup.retrofit2:retrofit:${Versions.retrofit_version}"
    val gson = "com.google.code.gson:gson:${Versions.gson_version}"
    val retrofit_converter = "com.squareup.retrofit2:converter-gson:${Versions.retrofit_version}"
}

object databaseDependencies {
    val room_runtime = "androidx.room:room-runtime:${Versions.room_version}"
    val room_compiler = "androidx.room:room-compiler:${Versions.room_version}"
    val room_rxjava = "androidx.room:room-rxjava2:${Versions.room_version}"
    val room_guava= "androidx.room:room-guava:${Versions.room_version}"
    val room_ktx = "androidx.room:room-ktx:${Versions.room_version}"
    val debug_db = "com.amitshekhar.android:debug-db:${Versions.debug_db_version}"
}

object firebaseDependencies {
    val crashlytics = "com.google.firebase:firebase-crashlytics:${Versions.crashlytics_version}"
    val analytics = "com.google.firebase:firebase-analytics:${Versions.crashlytics_version}"
}

//object androidxsupportDependencies{
//    val appcompat = "androidx.appcompat:appcompat:${Versions.appcompat}"
//    val cardview = "androidx.cardview:cardview:${Versions.cardview_version}"
//    val contraintLayout = "androidx.constraintlayout:constraintlayout:${Versions.constraint_layout_version}"
//    val recyclerview = "androidx.recyclerview:recyclerview:${Versions.recycelerview_version}"
//    val viewpager2 = "androidx.viewpager2:viewpager2:${Versions.viewpager2_version}"
//}
//
//object materialDesignDependencies{
//    val materialDesign = "com.google.android.material:material:${Versions.material_design_version}"
//}
//
//object playcoreDependencies{
//    val play_core =  "com.google.android.play:core:${Versions.play_core_version}"
//}
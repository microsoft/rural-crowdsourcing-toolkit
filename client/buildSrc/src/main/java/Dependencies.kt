object Dependencies {

    object Kotlin {

        private const val kotlin_version = "1.4.1"

        val kotlin = "org.jetbrains.kotlin:kotlin-stdlib-jdk7:${kotlin_version}"

        object Coroutines {

            private const val coroutines_version = "1.3.9"

            const val coroutines =
                "org.jetbrains.kotlinx:kotlinx-coroutines-android:${coroutines_version}"
            const val core =
                "org.jetbrains.kotlinx:kotlinx-coroutines-core:${coroutines_version}"
        }

    }

    object AndroidX {

        private const val appcompat_version = "1.2.0"
        private const val constraint_layout_version = "2.0.4"
        private const val legacy_support_version = "1.0.0"
        private const val work_runtime_version = "2.5.0"
        private const val multidex_version = "2.0.1"

        const val appcompat = "androidx.appcompat:appcompat:$appcompat_version"
        const val constraintlayout = "androidx.constraintlayout:constraintlayout:$constraint_layout_version"
        const val legacy_support = "androidx.legacy:legacy-support-v4:$legacy_support_version"
        const val work_runtime = "androidx.work:work-runtime-ktx:$work_runtime_version"
        const val multidex = "androidx.multidex:multidex:$multidex_version"


        object Lifecycle {

            private const val version = "2.3.0"
            private const val extension_version = "2.2.0"
            const val runtimeKtx = "androidx.lifecycle:lifecycle-runtime-ktx:$version"
            const val extension = "androidx.lifecycle:lifecycle-extensions:$extension_version"
            const val viewmodelKtx = "androidx.lifecycle:lifecycle-viewmodel-ktx:$version"
            const val livedata = "androidx.lifecycle:lifecycle-livedata-ktx:$version"
            const val saved_state = "androidx.lifecycle:lifecycle-viewmodel-savedstate:$version"
        }

        object Room {
            private const val room_version = "2.2.6"
            val room_runtime = "androidx.room:room-runtime:$room_version"
            val room_compiler = "androidx.room:room-compiler:$room_version"
            val room_rxjava = "androidx.room:room-rxjava2:$room_version"
            val room_guava = "androidx.room:room-guava:$room_version"
            val room_ktx = "androidx.room:room-ktx:$room_version"
        }



    }

    object Google {

        private const val gson_version = "2.8.6"
        private const val material_design_version = "1.3.0"

        const val gson = "com.google.code.gson:gson:$gson_version"
        const val material_design = "com.google.android.material:material:$material_design_version"

        object Firebase {
            private const val crashlytics_version = "17.4.0"
            private const val analytics_version = "18.0.2"

            const val crashlytics = "com.google.firebase:firebase-crashlytics:$crashlytics_version"
            const val analytics = "com.google.firebase:firebase-analytics:$analytics_version"
        }
    }

    object ThirdParty {

        private const val debug_db_version = "1.0.6"
        private const val glide_version = "4.11.0"
        private const val state_progressbar_version = "1.0.0"

        const val debug_db = "com.amitshekhar.android:debug-db:$debug_db_version"
        const val glide = "com.github.bumptech.glide:glide:$glide_version"
        const val stateprogressbar = "com.kofigyan.stateprogressbar:stateprogressbar:$state_progressbar_version"

        object Squareup {

            private const val okhttp_version = "3.14.9"
            private const val retrofit_version = "2.9.0"


            const val okhttp = "com.squareup.okhttp3:okhttp:$okhttp_version"
            const val retrofit = "com.squareup.retrofit2:retrofit:$retrofit_version"
            const val retrofit_converter = "com.squareup.retrofit2:converter-gson:$retrofit_version"
        }

    }

}
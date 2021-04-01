import org.jetbrains.kotlin.config.KotlinCompilerVersion

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("kotlin-android-extensions")
    id("kotlin-kapt")
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
}

android {
    compileSdkVersion(29)
    defaultConfig {
        applicationId = "com.microsoft.research.karya"
        minSdkVersion(21)
        targetSdkVersion(29)
        multiDexEnabled = true
        versionCode = 24
        versionName = "1"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
    }
    buildTypes {
        named("release") {
            isMinifyEnabled = false
            setProguardFiles(listOf(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"))
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    lintOptions {
        isAbortOnError = false
    }
    androidExtensions {
        isExperimental = true
    }
    buildFeatures {
        dataBinding = true
    }
    buildToolsVersion = "29.0.3"
}

dependencyLocking {
    lockAllConfigurations()
}

dependencies {
    val room_version = "2.2.6"
    val lifecycle_version = "2.3.0"
    val arch_version = "2.1.0"

    // ViewModel
    implementation(Dependencies.AndroidX.Lifecycle.viewmodelKtx)
//    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:$lifecycle_version")
    // LiveData
//    implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")
    implementation(Dependencies.AndroidX.Lifecycle.livedata)
    // Lifecycles only (without ViewModel or LiveData)
//    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version")
    implementation(Dependencies.AndroidX.Lifecycle.runtimeKtx)
    // Saved state module for ViewModel
//    implementation("androidx.lifecycle:lifecycle-viewmodel-savedstate:$lifecycle_version")
    implementation(Dependencies.AndroidX.Lifecycle.saved_state)

    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.jar"))))

//    implementation("androidx.multidex:multidex:2.0.1")
    implementation(Dependencies.AndroidX.multidex)
//    implementation("androidx.lifecycle:lifecycle-extensions:2.2.0")
    implementation(Dependencies.AndroidX.Lifecycle.extension)
//    implementation("androidx.work:work-runtime-ktx:2.5.0")
    implementation(Dependencies.AndroidX.work_runtime)

    // UI Stuff
//    implementation("com.google.android.material:material:1.3.0")
    implementation(Dependencies.Google.material_design)
//    implementation("androidx.appcompat:appcompat:1.2.0")
    implementation(Dependencies.AndroidX.appcompat)
//    implementation("androidx.constraintlayout:constraintlayout:2.0.4")
    implementation(Dependencies.AndroidX.constraintlayout)
//    implementation("androidx.legacy:legacy-support-v4:1.0.0")
    implementation(Dependencies.AndroidX.legacy_support)
//    implementation("com.github.bumptech.glide:glide:4.11.0")
    implementation(Dependencies.ThirdParty.glide)
//    implementation("com.kofigyan.stateprogressbar:stateprogressbar:1.0.0")
    implementation(Dependencies.ThirdParty.stateprogressbar)

    // Kotlin Stuff
    implementation(kotlin("stdlib", KotlinCompilerVersion.VERSION))
    implementation(kotlin("reflect", version = "1.4.10"))
//    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.3.9")
//    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.3.9")
    implementation(Dependencies.Kotlin.Coroutines.core)
    implementation(Dependencies.Kotlin.Coroutines.coroutines)

    // Network stuff
//    implementation("com.squareup.okhttp3:okhttp:3.14.9")
    implementation(Dependencies.ThirdParty.Squareup.okhttp)
//    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation(Dependencies.ThirdParty.Squareup.retrofit)
//    implementation("com.google.code.gson:gson:2.8.6")
    implementation(Dependencies.Google.gson)
//    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation(Dependencies.ThirdParty.Squareup.retrofit_converter)

    // Database stuff
//    implementation("androidx.room:room-runtime:$room_version")
    implementation(Dependencies.AndroidX.Room.room_runtime)
//    kapt("androidx.room:room-compiler:$room_version")
    kapt(Dependencies.AndroidX.Room.room_compiler)
//    implementation("androidx.room:room-rxjava2:$room_version")
    implementation(Dependencies.AndroidX.Room.room_rxjava)
//    implementation("androidx.room:room-guava:$room_version")
    implementation(Dependencies.AndroidX.Room.room_guava)
//    implementation("androidx.room:room-ktx:$room_version")
    implementation(Dependencies.AndroidX.Room.room_ktx)

    // Firebase stuff
    implementation(Dependencies.Google.Firebase.crashlytics)
//    implementation("com.google.firebase:firebase-crashlytics:17.4.0")
    implementation(Dependencies.Google.Firebase.analytics)
//    implementation("com.google.firebase:firebase-analytics:18.0.2")

    // DEBUG DB
//    debugImplementation("com.amitshekhar.android:debug-db:1.0.6")
    debugImplementation(Dependencies.ThirdParty.debug_db)
}

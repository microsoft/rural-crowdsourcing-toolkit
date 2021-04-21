plugins {
    id("com.android.application")
    id("kotlin-android")
    id("kotlin-android-extensions")
    id("kotlin-kapt")
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
    id("dagger.hilt.android.plugin")
    id("com.ncorti.ktfmt.gradle") version "0.5.0"
}

android {
    compileSdkVersion(30)
    defaultConfig {
        applicationId = "com.microsoft.research.karya"
        minSdkVersion(21)
        targetSdkVersion(30)
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
    kotlinOptions {
        jvmTarget = "1.8"
    }
    lintOptions {
        isAbortOnError = false
    }
    androidExtensions {
        isExperimental = true
    }
    buildFeatures {
        dataBinding = true
        viewBinding = true
    }
    buildToolsVersion = "31.0.0-rc3"
}

dependencyLocking {
    lockAllConfigurations()
}

dependencies {

    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.jar"))))

    implementation(Dependencies.AndroidX.appcompat)
    implementation(Dependencies.AndroidX.constraintLayout)
    implementation(Dependencies.AndroidX.datastorePrefs)
    implementation(Dependencies.AndroidX.fragmentKtx)
    implementation(Dependencies.AndroidX.legacy_support)
    implementation(Dependencies.AndroidX.multidex)
    implementation(Dependencies.AndroidX.work_runtime)

    implementation(Dependencies.AndroidX.Lifecycle.common)
    implementation(Dependencies.AndroidX.Lifecycle.extensions)
    implementation(Dependencies.AndroidX.Lifecycle.livedataKtx)
    implementation(Dependencies.AndroidX.Lifecycle.runtimeKtx)
    implementation(Dependencies.AndroidX.Lifecycle.saved_state)
    implementation(Dependencies.AndroidX.Lifecycle.viewModelKtx)

    implementation(Dependencies.AndroidX.Navigation.fragmentKtx)
    implementation(Dependencies.AndroidX.Navigation.uiKtx)

    implementation(Dependencies.AndroidX.Room.roomKtx)
    implementation(Dependencies.AndroidX.Room.roomRuntime)

    implementation(Dependencies.AndroidX.Navigation.fragmentKtx)
    implementation(Dependencies.AndroidX.Navigation.uiKtx)

    kapt(Dependencies.AndroidX.Room.roomCompiler)

    implementation(Dependencies.Google.gson)
    implementation(Dependencies.Google.material)

    implementation(Dependencies.Google.Firebase.crashlytics)
    implementation(Dependencies.Google.Firebase.analytics)

    implementation(Dependencies.AndroidX.Hilt.dagger)
    implementation(Dependencies.AndroidX.Hilt.hiltNavigationFragment)

    kapt(Dependencies.AndroidX.Hilt.daggerCompiler)
    kapt(Dependencies.AndroidX.Hilt.daggerHiltCompiler)


    implementation(Dependencies.Kotlin.Coroutines.core)
    implementation(Dependencies.Kotlin.Coroutines.coroutines)

    implementation(Dependencies.ThirdParty.glide)
    implementation(Dependencies.ThirdParty.okhttp)
    implementation(Dependencies.ThirdParty.loggingInterceptor)
    implementation(Dependencies.ThirdParty.stateProgressBar)

    implementation(Dependencies.ThirdParty.Retrofit.retrofit)
    implementation(Dependencies.ThirdParty.Retrofit.gsonConverter)

    debugImplementation(Dependencies.ThirdParty.debugDB)
}

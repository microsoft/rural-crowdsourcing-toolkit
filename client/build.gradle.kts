// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    repositories {
        google()
        mavenCentral()

        // TODO: Remove JCenter
        @Suppress("JcenterRepositoryObsolete")
        jcenter {
            content {
                //  org.jetbrains.trove4j is only available in JCenter
                includeGroup("org.jetbrains.trove4j")
            }
        }
    }
    dependencies {
        classpath(Plugins.agp)
        classpath(Plugins.hilt)
        classpath(Plugins.kotlin)
        classpath(Plugins.gms)
        classpath(Plugins.crashlytics)
        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle.kts files
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven(url = "https://jitpack.io")

        // TODO: Remove JCenter
        @Suppress("JcenterRepositoryObsolete")
        jcenter {
            content {
                includeGroup("com.amitshekhar.android")
                includeGroup("com.kofigyan.stateprogressbar")
            }
        }
    }
}

tasks {
    val clean by registering(Delete::class) {
        delete(rootProject.buildDir)
    }
}

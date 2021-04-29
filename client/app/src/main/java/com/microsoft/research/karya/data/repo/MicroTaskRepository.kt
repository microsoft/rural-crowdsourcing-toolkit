package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.MicroTaskDao
import javax.inject.Inject

class MicroTaskRepository @Inject constructor(private val microTaskDao: MicroTaskDao) {}

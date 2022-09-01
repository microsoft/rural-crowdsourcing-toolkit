package com.microsoft.research.karya.ui.payment.transactions

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.ItemTransactionCardBinding
import com.microsoft.research.karya.ui.payment.dashboard.UserTransactionDetail
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.visible

class PaymentTransactionAdapter :
  RecyclerView.Adapter<PaymentTransactionAdapter.PaymentTransactionViewHolder>() {

  var transactions = listOf<UserTransactionDetail>()

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PaymentTransactionViewHolder {
    val layoutInflater = LayoutInflater.from(parent.context)
    val binding = ItemTransactionCardBinding.inflate(layoutInflater, parent, false)

    return PaymentTransactionViewHolder(binding)
  }

  override fun onBindViewHolder(holder: PaymentTransactionViewHolder, position: Int) {
    holder.bind(transactions[position])
  }

  override fun getItemCount(): Int {
    return transactions.size
  }

  fun updateList(list: List<UserTransactionDetail>) {
    transactions = list
    notifyDataSetChanged()
  }

  class PaymentTransactionViewHolder(private val binding: ItemTransactionCardBinding) :
    RecyclerView.ViewHolder(binding.root) {
    fun bind(transaction: UserTransactionDetail) {
      setupTransactionCard(binding.root.context, transaction)
    }

    private fun setupTransactionCard(
      context: Context,
      userTransactionDetail: UserTransactionDetail
    ) {
      with(binding) {
        transactionValueTv.text = context.getString(R.string.rs_float, userTransactionDetail.amount)
        referenceTv.text = userTransactionDetail.utr
        dateTv.text = userTransactionDetail.date

        transactionSuccessIv.invisible()
        transactionFailureIv.invisible()
        transactionPendingIv.invisible()

        when (userTransactionDetail.status) {
          "processed" -> transactionSuccessIv
          "reversed" -> transactionFailureIv
          else -> transactionPendingIv
        }.visible()
      }
    }
  }
}

package com.microsoft.research.karya.ui.payment.transactions

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.ItemTransactionCardBinding
import com.microsoft.research.karya.ui.payment.dashboard.UserTransactionDetail

class PaymentTransactionAdapter : RecyclerView.Adapter<PaymentTransactionAdapter.PaymentTransactionViewHolder>() {

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

    private fun setupTransactionCard(context: Context, userTransactionDetail: UserTransactionDetail) {
      with(binding) {
        amountTv.text = context.getString(R.string.amount_rs_2f, userTransactionDetail.amount)
        utrTv.text = context.getString(R.string.utr_s, userTransactionDetail.utr)
        statusTv.text = context.getString(R.string.status_s, userTransactionDetail.status)
        dateTv.text = context.getString(R.string.date_s, userTransactionDetail.date)
      }
    }
  }
}

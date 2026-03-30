//invoice number logic mate aa file banavi
//auto generate,unique,sequential<---requirement

/*const Invoice = require("../models/Invoice");

const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastInvoice) {
    const lastNumber = parseInt(
      lastInvoice.invoiceNumber.split("-")[1]
    );
    nextNumber = lastNumber + 1;
  }

  return `INV-${nextNumber.toString().padStart(4, "0")}`;
};

module.exports = generateInvoiceNumber;*/

const Invoice = require("../models/Invoice");

const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  if (!lastInvoice) return "INV-0001";

  const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[1]);
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `INV-${nextNumber}`;
};

module.exports = generateInvoiceNumber;


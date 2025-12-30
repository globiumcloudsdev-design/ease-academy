import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    contact: {
      phone: String,
      email: String,
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    bankAccounts: [
      {
        accountTitle: String,
        serviceName: String, // e.g., HBL, EasyPaisa, JazzCash
        accountNo: String,
        iban: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    settings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Branch = mongoose.models.Branch || mongoose.model('Branch', branchSchema);

export default Branch;

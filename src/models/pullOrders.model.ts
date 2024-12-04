import mongoose from 'mongoose';

const pullOrder = new mongoose.Schema(
	{
		venueId: {
			type: String,
			required: true
		}
	},
	{
		timestamps: true,
		toJSON: {
			transform: function (_doc, ret) {
				delete ret._id;
				delete ret.__v;
			}
		}
	}
);

export const PullOrderModel = mongoose.model('PullOrder', pullOrder);

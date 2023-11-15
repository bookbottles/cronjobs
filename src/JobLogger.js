import mongoose from 'mongoose';

const JobLogSchema = new mongoose.Schema({
	timestamp: { type: Date, default: Date.now },
	type: String,
	request: Object,
	response: Object,
	error: String
});

// Set the TTL (5 days in seconds)
JobLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 432000 });

export const JobLog = mongoose.model('JobLog', JobLogSchema);

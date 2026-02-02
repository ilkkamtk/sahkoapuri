import mongoose from 'mongoose';

export type UpdateType = {
  updated: Date;
};

const Schema = mongoose.Schema;

const updateSchema = new Schema<UpdateType>({
  updated: { type: Date, required: true },
});

export default mongoose.model<UpdateType>('Updates', updateSchema);

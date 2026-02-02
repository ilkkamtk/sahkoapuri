import mongoose from 'mongoose';

export type ExampleType = {
  title: string;
};

const Schema = mongoose.Schema;

const blogSchema = new Schema<ExampleType>({
  title: String,
});

export default mongoose.model<ExampleType>('Blog', blogSchema);

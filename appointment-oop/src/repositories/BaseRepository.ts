import type { Document, FilterQuery, Model, UpdateQuery } from "mongoose";

/**
 * The CRUD every collection needs, written once.
 *
 * `abstract` means nobody can do `new BaseRepository(...)`. It exists only to
 * be extended. Two generics:
 *   TDocument - the Mongoose document type for this collection
 *   TCreate   - the plain object accepted when creating one
 *
 * The model is `protected`, so a subclass can write its own queries against it
 * while nothing outside the repository layer can reach the model at all. That
 * is the boundary: services talk to repositories, repositories talk to Mongoose.
 */
export abstract class BaseRepository<TDocument extends Document, TCreate> {
    protected readonly model: Model<TDocument>;

    protected constructor(model: Model<TDocument>) {
        this.model = model;
    }

    public async create(data: TCreate): Promise<TDocument> {
        return this.model.create(data);
    }

    public async findById(id: string): Promise<TDocument | null> {
        return this.model.findById(id).exec();
    }

    public async findAll(filter: FilterQuery<TDocument> = {}): Promise<TDocument[]> {
        return this.model.find(filter).sort({ createdAt: -1 }).exec();
    }

    public async updateById(id: string, update: UpdateQuery<TDocument>): Promise<TDocument | null> {
        return this.model
            .findByIdAndUpdate(id, update, { new: true, runValidators: true })
            .exec();
    }

    public async deleteById(id: string): Promise<TDocument | null> {
        return this.model.findByIdAndDelete(id).exec();
    }

    public async existsById(id: string): Promise<boolean> {
        const found = await this.model.exists({ _id: id } as FilterQuery<TDocument>).exec();
        return found !== null;
    }

    public async count(filter: FilterQuery<TDocument> = {}): Promise<number> {
        return this.model.countDocuments(filter).exec();
    }
}

import { Provider, type ProviderAttrs, type ProviderDocument } from "../models/provider.model";
import { BaseRepository } from "./BaseRepository";

export class ProviderRepository extends BaseRepository<ProviderDocument, ProviderAttrs> {
    public constructor() {
        super(Provider);
    }
}

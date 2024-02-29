import {Vizable, VizableEntry} from './index.types';

export abstract class BaseAdapter<T> {
    private readonly _sources: Array<T>;

    constructor(sources: Array<T>) {
        this._sources = [...sources];
    }

    protected abstract into(source: T): VizableEntry;

    public adapt(): Vizable {
        return this._sources.map(this.into);
    }
}

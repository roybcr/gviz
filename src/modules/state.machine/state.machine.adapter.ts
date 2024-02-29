import {BaseAdapter} from '../../base.adapter';
import {VizableEntry} from '../../index.types';
import {IStateMachineEntry} from './state.machine.types';

export class stateMachineAdapter extends BaseAdapter<IStateMachineEntry> {
    constructor(sources: IStateMachineEntry[]) {
        super(sources);
    }

    protected into(source: IStateMachineEntry): VizableEntry {
        return {event: source.event, from: source.from_state, to: source.expected_transition_state};
    }
}

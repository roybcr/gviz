import {BaseAdapter} from './base.adapter';
import {promises as fsPromises} from 'fs';
import * as path from 'path';
import {StateMachineAdapter} from './modules/state.machine';

interface GraphOptions {
    name: string;
    fontname: string;
    directed: boolean;
    eventShape: string;
    stateShape: string;
}

export class GraphViz<T> {
    public graphStr = '';
    public options: GraphOptions = {
        name: '',
        directed: false,
        fontname: 'SF Pro Text',
        eventShape: 'Mrecord',
        stateShape: 'Mrecord',
    };

    constructor(
        private readonly _adapter: BaseAdapter<T>,
        options: GraphOptions,
    ) {
        this.options = {...this.options, ...options};
    }

    public async createGraph() {
        const {name, fontname, directed, eventShape, stateShape} = this.options;
        const entries = this._adapter.adapt();
        const indices = {sources: <Array<string>>[], events: <Array<string>>[]};

        const flattened = entries.reduce(
            (acc, {from, to, event}) => {
                let startIdx = acc.length;
                acc = acc.concat([from, event, to]);
                indices.sources.push(acc[startIdx++]);
                indices.events.push(acc[startIdx++]);
                indices.sources.push(acc[startIdx]);
                return acc;
            },
            <Array<string>>[],
        );

        const lines = [
            `${directed ? 'digraph' : 'graph'} ${name} {`,
            `   fontname="${fontname}"`,
            `   beautify=true`,
            `   node [fontname="${fontname}"]`,
            `   edge [fontname="${fontname}"]`,
            `   graph [rankdir=LR]`,
            `   splines="ortho"`,
            `   {`,
            `     node [`,
            `       shape=${stateShape}`,
            `       colorscheme=spectral11`,
            `       style="filled"`,
            `       width=0`,
            `       height=0.1`,
            `     ]`,
            [...new Set(indices.sources).values()]
                .map((source: string) => `     ${source} [fillcolor=2 fontcolor=white]`)
                .join('\n'),
            `   }`,
            `   {`,
            `     node [`,
            `       shape=${eventShape}`,
            `       width=0`,
            `       height=0.1`,
            `     ]`,
            [...new Set(indices.events).values()].map((event: string) => `     ${event}`).join('\n'),
            `   }`,
        ];

        const Edge = directed ? '->' : '--';
        for (let i = 0; i < flattened.length - 3; i += 3) {
            const [from, event, to] = [flattened[i], flattened[i + 1], flattened[i + 2]];
            lines.push(`   ${from} ${Edge} ${event};`);
            lines.push(`   ${event} ${Edge} ${to};`);
        }

        lines.push('}');
        this.graphStr = lines.join('\n');
        await this.writefile(name, this.graphStr);
    }

    private async writefile(filename: string, data: string): Promise<void> {
        const filepath = path.join(__dirname, `${filename}.gv.txt`);
        try {
            await fsPromises.writeFile(filepath, data, {encoding: 'utf8'});
        } catch (error) {
            throw new Error('Failed to write file');
        }
    }
}

const adapter = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'EDITING'},
    {event: 'WINDOW_SETTINGS_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_SERVICE_DATA', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_SERVICE_DATA', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SELECTION_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDIT_PREP', expected_transition_state: 'EDITING'},
    {event: 'ADD_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'ADDING'},
    {event: 'COPY_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'ADD_PREP', expected_transition_state: 'ADDING'},
    {event: 'ITEM_CREATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SELECTION_UPDATED', from_state: 'ADDING', expected_transition_state: 'EDIT_PREP'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'DELETE_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'DELETING'},
    {event: 'DELETE_RESOLVED', from_state: 'DELETING', expected_transition_state: 'EDITING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
]);

const outputsAdapter = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'IDLE'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FILTER_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SELECTION_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'WINDOW_SETTINGS_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'EDIT_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FILTER_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'PREV_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'NEXT_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'ITEM_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'ADD_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'ADD_PREP'},
    {event: 'COPY_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'FILTER_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'PREV_ITEM_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'NEXT_ITEM_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'ITEM_CREATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'DELETE_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'DELETING'},
    {event: 'ITEM_DELETED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
    {event: 'DELETE_RESOLVED', from_state: 'DELETING', expected_transition_state: 'IDLE'},
    {event: 'START_ENCODER_REQUEST', from_state: 'IDLE', expected_transition_state: 'STARTING'},
    {event: 'START_ENCODER_RESOLVED', from_state: 'STARTING', expected_transition_state: 'IDLE'},
    {event: 'STOP_ENCODER_REQUEST', from_state: 'IDLE', expected_transition_state: 'STOPPING'},
    {event: 'STOP_ENCODER_RESOLVED', from_state: 'STOPPING', expected_transition_state: 'IDLE'},
]);

const layoutConfigPanelMachine = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'EDITING'},
    {event: 'WINDOW_SETTINGS_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_SERVICE_DATA', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_SERVICE_DATA', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SELECTION_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDIT_PREP', expected_transition_state: 'EDITING'},
    {event: 'ADD_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'ADDING'},
    {event: 'COPY_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'ADD_PREP', expected_transition_state: 'ADDING'},
    {event: 'ITEM_CREATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SELECTION_UPDATED', from_state: 'ADDING', expected_transition_state: 'EDIT_PREP'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'DELETE_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'DELETING'},
    {event: 'DELETE_RESOLVED', from_state: 'DELETING', expected_transition_state: 'EDITING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
]);

const operatorInterfacePanelAdapter = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'EDITING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'OUTPUT_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'WINDOW_SETTINGS_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OUTPUT_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_SERVICE_DATA', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SELECTION_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDIT_PREP', expected_transition_state: 'EDITING'},
    {event: 'INSTANCE_DATA_CHANGED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SAVE_RESOLVED_SUCCESS', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SAVE_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SAVE_RESOLVED_ERROR', from_state: 'EDITING', expected_transition_state: 'EDITING'},
]);

const operatorInterfaceWrapperAdapter = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'IDLE'},
    {event: 'SAVE_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'ITEM_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SELECTION_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SAVE_RESOLVED_ERROR', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SAVE_RESOLVED_SUCCESS', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'WINDOW_SETTINGS_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
]);

const operatorInterfaceFormAdapter = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'CHANNELS_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'TIMEZONES_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'AUDIOS_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'INSTANCE_DATA_CHANGED', from_state: 'INITIALIZING', expected_transition_state: 'EDITING'},
    {event: 'SAVE_REQUEST', from_state: 'ADDING', expected_transition_state: 'SAVING'},
    {event: 'INSTANCE_DATA_CHANGED', from_state: 'ADDING', expected_transition_state: 'EDITING'},
    {event: 'CHANNELS_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'TIMEZONES_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SET_FILTER_CHANNELS_DATA', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SET_FILTER_TIMEZONES_DATA', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SAVE_REQUEST', from_state: 'EDITING', expected_transition_state: 'SAVING'},
    {event: 'CHANNELS_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'AUDIOS_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'TIMEZONES_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'INSTANCE_DATA_CHANGED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_AUDIOS_DATA', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_CHANNELS_DATA', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SET_FILTER_TIMEZONES_DATA', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SAVE_REQUEST', from_state: 'ERROR', expected_transition_state: 'SAVING'},
    {event: 'INSTANCE_DATA_CHANGED', from_state: 'ERROR', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'ERROR', expected_transition_state: 'ERROR'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ERROR', expected_transition_state: 'ERROR'},
    {event: 'SET_FILTER_AUDIOS_DATA', from_state: 'ERROR', expected_transition_state: 'ERROR'},
    {event: 'SET_FILTER_CHANNELS_DATA', from_state: 'ERROR', expected_transition_state: 'ERROR'},
    {event: 'SET_FILTER_TIMEZONES_DATA', from_state: 'ERROR', expected_transition_state: 'ERROR'},
    {event: 'SAVE_RESOLVED_SUCCESS', from_state: 'SAVING', expected_transition_state: 'SAVING'},
    {event: 'INSTANCE_DATA_CHANGED', from_state: 'SAVING', expected_transition_state: 'EDITING'},
    {event: 'SAVE_RESOLVED_ERROR', from_state: 'SAVING', expected_transition_state: 'ERROR'},
]);

const outputsConfigAdapter = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'IDLE'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FILTER_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SELECTION_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'WINDOW_SETTINGS_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'EDIT_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FILTER_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'PREV_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'NEXT_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'ITEM_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'ADD_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'ADD_PREP'},
    {event: 'COPY_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'DEVICES_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'NETWORKS_DATA_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'FILTER_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'PREV_ITEM_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'NEXT_ITEM_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'ITEM_CREATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'DELETE_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'DELETING'},
    {event: 'ITEM_DELETED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
    {event: 'DELETE_RESOLVED', from_state: 'DELETING', expected_transition_state: 'IDLE'},
    {event: 'START_ENCODER_REQUEST', from_state: 'IDLE', expected_transition_state: 'STARTING'},
    {event: 'START_ENCODER_RESOLVED', from_state: 'STARTING', expected_transition_state: 'IDLE'},
    {event: 'STOP_ENCODER_REQUEST', from_state: 'IDLE', expected_transition_state: 'STOPPING'},
    {event: 'STOP_ENCODER_RESOLVED', from_state: 'STOPPING', expected_transition_state: 'IDLE'},
]);

const combinedDevicesAdapter = new StateMachineAdapter([
    {event: 'INITIALIZE', from_state: 'INIT', expected_transition_state: 'INITIALIZING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'INITIALIZING', expected_transition_state: 'INITIALIZING'},
    {event: 'INITIALIZE_RESOLVED', from_state: 'INITIALIZING', expected_transition_state: 'IDLE'},
    {event: 'SELECTION_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'WINDOW_SETTINGS_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'FILTER_UPDATED', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'EDIT_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDIT_PREP', expected_transition_state: 'EDIT_PREP'},
    {event: 'FILTER_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'PREV_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'NEXT_ITEM_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'ITEM_UPDATED', from_state: 'EDITING', expected_transition_state: 'EDITING'},
    {event: 'ADD_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'FETCH_ITEM_RESOLVED', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ADD_PREP', expected_transition_state: 'ADD_PREP'},
    {event: 'FILTER_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'PREV_ITEM_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'NEXT_ITEM_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'OPEN_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'CLOSE_DRAWER_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'FETCH_ALL_REQUEST', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'ITEM_CREATED', from_state: 'ADDING', expected_transition_state: 'ADDING'},
    {event: 'DELETE_ITEM_REQUEST', from_state: 'IDLE', expected_transition_state: 'DELETING'},
    {event: 'ITEM_DELETED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
    {event: 'SERVICE_DATE_UPDATED', from_state: 'DELETING', expected_transition_state: 'DELETING'},
    {event: 'DELETE_RESOLVED', from_state: 'DELETING', expected_transition_state: 'IDLE'},
    {event: 'SET_FILTER_SERVICE_DATA', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'ITEM_INFO_REQUEST', from_state: 'IDLE', expected_transition_state: 'IDLE'},
    {event: 'DEVICE_REBOOT_REQUEST', from_state: 'IDLE', expected_transition_state: 'DEVICE_REBOOTING'},
    {event: 'DEVICE_REBOOT_RESOLVED', from_state: 'DEVICE_REBOOTING', expected_transition_state: 'IDLE'},
    {event: 'DEVICE_RESET_REQUEST', from_state: 'IDLE', expected_transition_state: 'DEVICE_RESETTING'},
    {event: 'DEVICE_RESET_RESOLVED', from_state: 'DEVICE_RESETTING', expected_transition_state: 'IDLE'},
    {event: 'DEVICE_SHUTDOWN_REQUEST', from_state: 'IDLE', expected_transition_state: 'DEVICE_SHUTDOWN'},
    {event: 'DEVICE_SHUTDOWN_RESOLVED', from_state: 'DEVICE_SHUTDOWN', expected_transition_state: 'IDLE'},
    {event: 'DEVICE_SYNC_REQUEST', from_state: 'IDLE', expected_transition_state: 'DEVICE_SYNCING'},
    {event: 'DEVICE_SYNC_RESOLVED', from_state: 'DEVICE_SYNCING', expected_transition_state: 'IDLE'},
]);

const graphviz = new GraphViz(adapter, {
    name: 'OperatorInterface',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz.createGraph();

const graphviz2 = new GraphViz(outputsAdapter, {
    name: 'Outputs',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz2.createGraph();

const graphviz3 = new GraphViz(layoutConfigPanelMachine, {
    name: 'LayoutConfigPanel',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz3.createGraph();

const graphviz4 = new GraphViz(operatorInterfacePanelAdapter, {
    name: 'OperatorInterfacePanel',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz4.createGraph();

const graphviz5 = new GraphViz(operatorInterfaceWrapperAdapter, {
    name: 'OperatorInterfaceWrapper',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz5.createGraph();

const graphviz6 = new GraphViz(operatorInterfaceFormAdapter, {
    name: 'OperatorInterfaceForm',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz6.createGraph();

const graphviz7 = new GraphViz(outputsConfigAdapter, {
    name: 'OutputsConfig',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz7.createGraph();

const graphviz8 = new GraphViz(combinedDevicesAdapter, {
    name: 'CombinedDevices',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'Mrecord',
});

graphviz8.createGraph();

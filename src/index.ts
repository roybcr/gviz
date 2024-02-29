import {BaseAdapter} from './base.adapter';
import {promises as fsPromises} from 'fs';
import * as path from 'path';
import {stateMachineAdapter} from './modules/state.machine';

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
        stateShape: 'ellipse',
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
            `${directed ? 'digraph' : 'graph'} ${name}`,
            `   {`,
            `   fontname="${fontname}"`,
            `   node [fontname="${fontname}" height=.1 width=.1]`,
            `   edge [fontname="${fontname}"]`,
            `   graph [rankdir=LR]`,
            `   { node [shape=${stateShape}]
                    ${indices.sources.join(' ')}
                }
            `,
            `   { node [shape=${eventShape}]
                    ${indices.events.join(' ')}
                }
            `,
        ];

        const Edge = directed ? '->' : '--';
        for (let i = 0; i < flattened.length - 3; i += 3) {
            const [from, event, to] = [flattened[i], flattened[i + 1], flattened[i + 2]];
            lines.push(`    ${from} ${Edge} ${event};`);
            lines.push(`    ${event} ${Edge} ${to};`);
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

const adapter = new stateMachineAdapter([
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

const outputsAdapter = new stateMachineAdapter([
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

const graphviz = new GraphViz(adapter, {
    name: 'OperatorInterface',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'ellipse',
});

graphviz.createGraph();

const graphviz2 = new GraphViz(outputsAdapter, {
    name: 'Outputs',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'ellipse',
});

graphviz2.createGraph();

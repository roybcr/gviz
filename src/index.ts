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

const graphviz = new GraphViz(adapter, {
    name: 'OperatorInterface',
    directed: true,
    fontname: 'Helvetica',
    eventShape: 'Mrecord',
    stateShape: 'ellipse',
});

graphviz.createGraph();

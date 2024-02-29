export interface IStateMachineEntry {
    event: string;
    from_state: string;
    expected_transition_state: string;
}

export type TStateMachine = Array<IStateMachineEntry>;

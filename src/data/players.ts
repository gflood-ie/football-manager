export interface Player {
    id: string;
    name: string;
    position: string;
    number?: number;
}

export const initialPlayers: Player[] = [
    { id: '1', name: 'Patrick', position: 'Midfielder', number: 8 },
    { id: '2', name: 'Conor', position: 'Defender', number: 4 },
    { id: '3', name: 'Liam', position: 'Striker', number: 9 },
    { id: '4', name: 'Sean', position: 'Goalkeeper', number: 1 },
    { id: '5', name: 'Cormac', position: 'Defender', number: 5 },
    { id: '6', name: 'Eoghan', position: 'Midfielder', number: 6 },
    { id: '7', name: 'Niall', position: 'Winger', number: 7 },
    { id: '8', name: 'Ronan', position: 'Forward', number: 10 },
    { id: '9', name: 'Kieran', position: 'Defender', number: 3 },
    { id: '10', name: 'Oisin', position: 'Midfielder', number: 11 },
];

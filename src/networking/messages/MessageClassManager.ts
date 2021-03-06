import { IMessageComposer } from './IMessageComposer';
import { IMessageConfiguration } from './IMessageConfiguration';
import { IMessageEvent } from './IMessageEvent';
import { MessageEvent } from './MessageEvent';

export class MessageClassManager
{
    private _messageIdByEvent: Map<string, number>;
    private _messageIdByComposer: Map<string, number>;
    private _messageInstancesById: Map<number, IMessageEvent[]>;

    constructor()
    {
        this._messageIdByEvent      = new Map();
        this._messageIdByComposer   = new Map();
        this._messageInstancesById  = new Map();
    }

    public dispose(): void
    {
        this._messageIdByEvent.clear();
        this._messageIdByComposer.clear();
        this._messageInstancesById.clear();
    }

    public registerMessages(configuration: IMessageConfiguration): void
    {
        for(let [ header, handler ] of configuration.events) this.registerMessageEventClass(header, handler);

        for(let [ header, handler ] of configuration.composers) this.registerMessageComposerClass(header, handler);
    }

    private registerMessageEventClass(header: number, handler: Function): void
    {
        if(!header || !handler) return;

        const existing = this._messageIdByEvent.get(handler.name);

        if(existing) return;

        this._messageIdByEvent.set(handler.name, header);
    }

    private registerMessageComposerClass(header: number, handler: Function): void
    {
        if(!header || !handler) return;

        const existing = this._messageIdByComposer.get(handler.name);

        if(existing) return;

        this._messageIdByComposer.set(handler.name, header);
    }

    public registerMessageEvent(event: IMessageEvent): void
    {
        const header = this.getEventId(event);

        if(!header) return;

        let existing = this._messageInstancesById.get(header);

        if(!existing || !existing.length)
        {
            existing = [];

            this._messageInstancesById.set(header, existing);

            //@ts-ignore
            event.parser = new event.parserClass();
        }
        else
        {
            event.parser = existing[0].parser;
        }

        existing.push(event);
    }

    public removeMessageEvent(event: IMessageEvent): void
    {
        const header = this.getEventId(event);

        if(!header) return;

        const existing = this._messageInstancesById.get(header);

        if(!existing) return;

        for(let [ index, message ] of existing.entries())
        {
            if(!message) continue;

            if(message !== event) continue;

            existing.splice(index, 1);

            if(existing.length === 0) this._messageInstancesById.delete(header);

            message.dispose();

            return;
        }
    }

    public getEvents(header: number): IMessageEvent[]
    {
        if(!header) return;

        const existing = this._messageInstancesById.get(header);

        if(!existing) return;

        return existing;
    }

    public getEventId(event: IMessageEvent): number
    {
        if(!event) return -1;

        //@ts-ignore
        const name = event instanceof MessageEvent ? event.constructor.name : event.name;

        const existing = this._messageIdByEvent.get(name);

        if(!existing) return -1;

        return existing;
    }

    public getComposerId(composer: IMessageComposer): number
    {
        if(!composer) return -1;

        const existing = this._messageIdByComposer.get(composer.constructor.name);

        if(!existing) return -1;

        return existing;
    }
}
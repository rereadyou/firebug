/* See license.txt for terms of usage */

define([
    "firebug/lib/object",
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/events",
],
function(Obj, Firebug, FBTrace, Events) {

// ********************************************************************************************* //
// EventMonitor Module

Firebug.EventMonitor = Obj.extend(Firebug.Module,
{
    dispatchName: "eventMonitor",

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Module

    destroyContext: function(context, persistedState)
    {
        // Clean up all existing monitors.
        var eventsMonitored = context.eventsMonitored;
        if (eventsMonitored)
        {
            for (var i=0; i<eventsMonitored.length; ++i)
            {
                var m = eventsMonitored[i];

                if (!m.type)
                    Events.detachAllListeners(m.object, context.onMonitorEvent, context);
                else
                    Events.removeEventListener(m.object, m.type, context.onMonitorEvent, false);
            }
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Event Monitor

    toggleMonitorEvents: function(object, types, state, context)
    {
        if (state)
            this.unmonitorEvents(object, types, context);
        else
            this.monitorEvents(object, types, context);
    },

    monitorEvents: function(object, types, context)
    {
        if (object && object.addEventListener)
        {
            if (!context.onMonitorEvent)
            {
                var self = this;
                context.onMonitorEvent = function(event) {
                    self.onMonitorEvent(event, context);
                };
            }

            if (!context.eventsMonitored)
                context.eventsMonitored = [];

            var eventTypes = getMonitoredEventTypes(types);

            if (FBTrace.DBG_EVENTS)
                FBTrace.sysout("EventMonitor.monitorEvents", eventTypes);

            for (var i = 0; i < eventTypes.length; ++i)
            {
                if (!this.areEventsMonitored(object, eventTypes[i], context))
                {
                    Events.addEventListener(object, eventTypes[i], context.onMonitorEvent, false);
                    context.eventsMonitored.push({object: object, type: eventTypes[i]});
                }
            }
        }
    },

    unmonitorEvents: function(object, types, context)
    {
        var eventsMonitored = context.eventsMonitored;
        var eventTypes = getMonitoredEventTypes(types);

        if (FBTrace.DBG_EVENTS)
            FBTrace.sysout("EventMonitor.unmonitorEvents", eventTypes);

        for (var i = 0; i < eventTypes.length; ++i)
        {
            for (var j = 0; j < eventsMonitored.length; ++j)
            {
                if (eventsMonitored[j].object == object && eventsMonitored[j].type == eventTypes[i])
                {
                    eventsMonitored.splice(j, 1);

                    Events.removeEventListener(object, eventTypes[i], context.onMonitorEvent, false);
                    break;
                }
            }
        }
    },

    areEventsMonitored: function(object, types, context)
    {
        var eventsMonitored = context.eventsMonitored;
        if (!eventsMonitored)
        {
            if (FBTrace.DBG_EVENTS)
                FBTrace.sysout("EventMonitor.areEventsMonitored - No events monitored", object);

            return false;
        }

        if (!types)
            var eventTypes = Events.getEventTypes();
        else
            var eventTypes = typeof types == "string" ? [types] : types;

        for (var i = 0; i < eventTypes.length; ++i)
        {
            var monitored = false;
            for (var j = 0; j < eventsMonitored.length; ++j)
            {
                if (eventsMonitored[j].object == object && eventsMonitored[j].type == eventTypes[i])
                {
                    monitored = true;
                    break;
                }
            }

            if (!monitored)
            {
                if (FBTrace.DBG_EVENTS)
                {
                    FBTrace.sysout("EventMonitor.areEventsMonitored - Events not monitored for '" +
                        eventTypes[i] + "'");
                }

                return false;
            }
            else
            {
                if (FBTrace.DBG_EVENTS)
                {
                    FBTrace.sysout("EventMonitor.areEventsMonitored - Events monitored for '" +
                        eventTypes[i] + "'");
                }
            }
        }

        return true;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Logging

    onMonitorEvent: function(event, context)
    {
        Firebug.Console.log(event, context);
    }
});

//********************************************************************************************* //
// Helpers

function getMonitoredEventTypes(types)
{
    var eventTypes = [];
    if (!types)
    {
        eventTypes = Events.getEventTypes();
    }
    else
    {
        if (typeof types == "string")
        {
            eventTypes = Events.isEventFamily(types) ? Events.getEventTypes(types) : [types];
        }
        else
        {
            for (var i = 0; i < types.length; ++i)
            {
                if (Events.isEventFamily(types[i]))
                {
                    var familyEventTypes = Events.getEventTypes(types[i]);
                    for (var j = 0; j < familyEventTypes.length; ++j)
                        eventTypes.push(familyEventTypes[j]);
                }
                else
                {
                    eventTypes.push(types[i]);
                }
            }
        }
    }

    return eventTypes;
}

// ********************************************************************************************* //
// Registration & Export

Firebug.registerModule(Firebug.EventMonitor);

return Firebug.EventMonitor;

// ********************************************************************************************* //
});

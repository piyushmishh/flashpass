-- reserveStock.lua
--
-- Atomic ticket reservation using Redis. This is the single most important
-- script in the entire system — it's what makes it possible for thousands
-- of users to simultaneously try to grab tickets without overselling.
--
-- The atomicity guarantee of EVAL means no race conditions: between the
-- stock check and the decrement, nobody else can sneak in.
--
-- KEYS[1] = "event:{eventId}:stock"        — current available stock counter
-- KEYS[2] = "user:{userId}:event:{eventId}" — per-user reservation flag
--
-- ARGV[1] = requested quantity (e.g. 1 or 2)
-- ARGV[2] = max tickets per user (e.g. 2)
-- ARGV[3] = reservation TTL in seconds (e.g. 600)
--
-- Returns:
--   >= 0   success — the new stock count after reservation
--   -1     sold out (not enough stock)
--   -2     user already has a reservation for this event

local stockKey = KEYS[1]
local userKey  = KEYS[2]

local requestedQty = tonumber(ARGV[1])
local maxPerUser   = tonumber(ARGV[2])
local ttlSeconds   = tonumber(ARGV[3])

-- Step 1: Check if this user already grabbed tickets for this event.
-- We don't allow double-dipping — one reservation per user per event.
local existingReservation = redis.call('GET', userKey)
if existingReservation then
    return -2
end

-- Step 2: Read current stock
local currentStock = tonumber(redis.call('GET', stockKey))
if not currentStock then
    -- Stock key doesn't exist — event probably hasn't been initialised yet
    return -1
end

-- Step 3: Do we have enough tickets left?
if currentStock < requestedQty then
    return -1
end

-- Step 4: All checks passed — decrement stock and mark the user's reservation
redis.call('DECRBY', stockKey, requestedQty)
redis.call('SET', userKey, requestedQty, 'EX', ttlSeconds)

-- Return the new stock level so we can broadcast it immediately
return currentStock - requestedQty

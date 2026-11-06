-- releaseStock.lua
--
-- Compensating action: return tickets to the pool when an order is cancelled,
-- expires, or payment fails. This is the other half of the saga — if
-- reserveStock.lua is the "do", this is the "undo".
--
-- KEYS[1] = "event:{eventId}:stock"         — current available stock counter
-- KEYS[2] = "user:{userId}:event:{eventId}"  — per-user reservation flag
--
-- ARGV[1] = quantity to release back
--
-- Returns: new stock count after release

local stockKey = KEYS[1]
local userKey  = KEYS[2]

local releaseQty = tonumber(ARGV[1])

-- Remove the user's reservation flag so they can try again if they want
redis.call('DEL', userKey)

-- Put the tickets back into the pool
local newStock = redis.call('INCRBY', stockKey, releaseQty)

return newStock

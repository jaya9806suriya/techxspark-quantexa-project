"""
Traffic and Network endpoints.
"""
from backend.services.traffic_service import TrafficService

try:
    from fastapi import APIRouter
    router = APIRouter(prefix="/traffic", tags=["Traffic"])

    @router.get("/nodes")
    def get_nodes():
        return TrafficService.get_all_nodes()

    @router.get("/edges")
    def get_edges():
        return TrafficService.get_all_edges()

    @router.get("/live-metrics")
    def get_live_metrics():
        return TrafficService.get_live_metrics()

    @router.get("/intersections")
    def get_intersections():
        return TrafficService.get_intersections()

    @router.get("/intersections/{intersection_id}")
    def get_intersection(intersection_id: str):
        return TrafficService.get_intersection_by_id(intersection_id)

    @router.get("/signals")
    def get_signals():
        return TrafficService.get_signals()

    @router.get("/network")
    def get_network():
        return TrafficService.get_network_graph()
except ImportError:
    router = None

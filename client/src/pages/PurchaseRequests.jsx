import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  HandThumbUpIcon,
  CheckIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import * as purchasesApi from "../api/purchases";
import * as externalApi from "../api/external";
import "./PurchaseRequests.css";

// Fix for Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const PurchaseRequests = () => {
  const { user, familyId } = useAuth();
  const { toast, confirm } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    estimatedPrice: "",
    urgency: "medium",
    storeLocation: "",
  });
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const fetchRequests = async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await purchasesApi.fetchPurchases(familyId);
      setRequests(data);
    } catch (error) {
      console.error("Fetch requests error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [familyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await purchasesApi.createPurchase({ ...form, familyId });
      setShowModal(false);
      setForm({ productName: "", estimatedPrice: "", urgency: "medium", storeLocation: "" });
      fetchRequests();
      toast("Demande postee !", "success");
    } catch (error) {
      console.error("Create request error detail:", error);
      toast(error.message || "Erreur lors de la creation.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await purchasesApi.updatePurchaseStatus(id, action);
      await fetchRequests();
      toast(`Action "${action}" effectuee.`, "success");
    } catch (error) {
      toast(`Erreur lors de l'action "${action}".`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (submitting) return;
    const ok = await confirm("Supprimer cette demande ?");
    if (!ok) return;
    setSubmitting(true);
    try {
      await purchasesApi.deletePurchase(id);
      await fetchRequests();
      toast("Demande supprimee.", "success");
    } catch (error) {
      toast("Erreur lors de la suppression.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyColor = (u) => {
    if (u === "high") return "#f87171";
    if (u === "medium") return "#fb923c";
    return "#34d399";
  };

  const getUrgencyLabel = (u) => {
    if (u === "high") return "URGENT";
    if (u === "medium") return "MOYEN";
    return "FAIBLE";
  };

  // Map Component to handle dynamic location
  const MapPreview = ({ location, isModal = false, onLocationSelect = null, isExpanded, setIsExpanded }) => {
    const [coords, setCoords] = useState(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(false);

    // Initial position based on geolocation or default
    useEffect(() => {
      if (!location && isModal && !coords) {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              // Only use if within Tunisia bounds roughly (approx 30 to 38 lat, 7 to 12 lon)
              if (latitude > 30 && latitude < 38 && longitude > 7 && longitude < 12) {
                setCoords([latitude, longitude]);
              } else {
                setCoords([36.8065, 10.1815]);
              }
            },
            () => {
              setCoords([36.8065, 10.1815]);
            }
          );
        } else {
          setCoords([36.8065, 10.1815]);
        }
      }
    }, [isModal, location]);

    // Initial geocoding when location text changes
    useEffect(() => {
      if (!location) {
        // We don't clear coords here if we already have them from geolocation
        // only reset if we're not in modal or if we want to reset to user location
        setError(false);
        setSearching(false);
        return;
      }
      
      setSearching(true);
      const timer = setTimeout(async () => {
        try {
          const data = await externalApi.searchLocation(location);
          if (data && data.length > 0) {
            setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            setError(false);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error("Geocoding error", err);
          setError(true);
        } finally {
          setSearching(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    }, [location]);

    const ChangeView = ({ center }) => {
      const map = useMap();
      useEffect(() => {
        if (center) map.setView(center, isExpanded ? 16 : 15);
      }, [center, map, isExpanded]);
      return null;
    };

    const MapEvents = () => {
      useMapEvents({
        click: async (e) => {
          if (!isModal || !onLocationSelect) return;
          const { lat, lng } = e.latlng;
          setCoords([lat, lng]);
          
          // Reverse geocoding to get address name
          try {
            const data = await externalApi.reverseGeocode(lat, lng);
            if (data && data.display_name) {
              const shortName = data.display_name.split(',').slice(0, 2).join(',');
              onLocationSelect(shortName);
            }
          } catch (err) {
            console.error("Reverse geocoding error", err);
          }
        },
      });
      return null;
    };

    return (
      <div className={`request-location-map ${isModal ? 'modal-map' : ''} ${isExpanded ? 'is-expanded' : ''}`} style={{ cursor: isModal ? 'crosshair' : 'default' }}>
        {searching && (
          <div className="map-overlay-status">Recherche en Tunisie de "{location}"...</div>
        )}
        {error && location && !searching && (
          <div className="map-overlay-status map-error">Lieu non trouve en Tunisie</div>
        )}
        {!coords && !searching && !error ? (
          <div className="map-overlay-status">Chargement de la carte...</div>
        ) : (
          <MapContainer 
            key={isModal ? `modal-map-${isExpanded}` : coords ? `${coords[0]}-${coords[1]}` : 'default'}
            center={coords || [36.8065, 10.1815]} 
            zoom={isExpanded ? 16 : 15} 
            scrollWheelZoom={isExpanded} 
            zoomControl={isModal} 
            dragging={true}
            maxBounds={[[30.2, 7.5], [37.6, 11.6]]} // Roughly restricts view to Tunisia
            minZoom={6}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {coords && <Marker position={coords} />}
            <ChangeView center={coords} />
            <MapEvents />
          </MapContainer>
        )}
        
        {isModal && (
          <>
            <button 
              type="button"
              className="btn-expand-map"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={isExpanded ? "Reduire" : "Agrandir"}
            >
              {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={16} height={16}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3 3m12 12v4.5m0-4.5h4.5m-4.5 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={16} height={16}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
            <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 1000, background: 'rgba(13, 27, 42, 0.8)', padding: '4px 8px', borderRadius: 6, fontSize: '0.65rem', color: 'var(--accent)', border: '1px solid var(--border)', pointerEvents: 'none' }}>
              Cliquez sur la carte pour choisir un lieu
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="purchase-page">
      <Sidebar />
      <div className="purchase-page__main">
        <Header title="Courses & Demandes" userName={user?.name} hasNotif />
        
        <div className="purchase-content">
          {/* ── État "Aucun groupe actif" ── */}
          {!familyId ? (
            <div className="requests-empty" style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              minHeight: "calc(100vh - 150px)", 
              padding: "40px 24px" 
            }}>
              <div style={{ 
                textAlign: "center", 
                maxWidth: 400, 
                width: "100%",
                padding: "48px 32px", 
                background: "var(--surface)", 
                borderRadius: 32, 
                border: "1px solid var(--border)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 24, 
                  background: "var(--accent-soft)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  marginBottom: 28, 
                  color: "var(--accent)",
                  boxShadow: "0 10px 20px rgba(45,212,191,0.15)"
                }}>
                  <ShoppingBagIcon width={40} height={40} />
                </div>
                <h2 style={{ 
                  fontFamily: "var(--font-head)", 
                  fontSize: "1.75rem", 
                  fontWeight: 800, 
                  marginBottom: 16,
                  color: "var(--text)"
                }}>Tu n'es dans aucun groupe</h2>
                <p style={{ 
                  fontSize: "0.95rem", 
                  color: "var(--text-soft)", 
                  marginBottom: 36, 
                  lineHeight: 1.6,
                  maxWidth: "300px"
                }}>Rejoins ou cree un groupe pour commencer a poster des demandes d'achats.</p>
                <button 
                  className="btn-primary" 
                  style={{ 
                    width: "100%", 
                    padding: "16px", 
                    borderRadius: 16, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "1rem",
                    fontWeight: 700,
                    boxShadow: "0 8px 20px rgba(45,212,191,0.25)"
                  }}
                  onClick={() => navigate("/group")}
                >
                  Gerer mes groupes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="purchase-header">
                <div>
                  <h2 className="purchase-title">Demandes d'achats</h2>
                  <p className="purchase-subtitle">Postez ce qu'il vous faut quand vous n'etes pas dispo.</p>
                </div>
                <button className="btn-add-purchase" onClick={() => setShowModal(true)}>
                  <PlusIcon width={20} height={20} />
                  Nouvelle demande
                </button>
              </div>

              {loading ? (
                <div className="loading-state">Chargement des demandes...</div>
              ) : requests.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBagIcon width={48} height={48} />
                  <h3>Pas de demandes</h3>
                  <p>Tout le monde a l'air d'avoir ce qu'il faut !</p>
                </div>
              ) : (
                <div className="requests-feed">
                  {requests.map((req) => (
                    <div key={req._id} className={`request-card status-${req.status}`}>
                      <div className="request-card__top">
                        <div className="request-info">
                          <div className="request-product">{req.productName}</div>
                          <div className="request-meta">
                            <span className="request-price">{req.estimatedPrice} TND</span>
                            <span className="dot">•</span>
                            <span className="request-user">Par {req.requestedBy?.name}</span>
                          </div>
                        </div>
                        <div className="request-urgency" style={{ color: getUrgencyColor(req.urgency), borderColor: getUrgencyColor(req.urgency) }}>
                          {getUrgencyLabel(req.urgency)}
                        </div>
                      </div>

                      {req.storeLocation && (
                        <div className="request-body">
                          <MapPreview location={req.storeLocation} isExpanded={false} setIsExpanded={() => {}} />
                          <div className="request-location-text">
                            <MapPinIcon width={16} height={16} />
                            {req.storeLocation}
                          </div>
                        </div>
                      )}

                      <div className="request-card__bottom">
                        <div className="request-status">
                          {req.status === "pending" && <span className="badge-pending"><ClockIcon width={14} height={14} /> En attente</span>}
                          {req.status === "accepted" && <span className="badge-accepted"><HandThumbUpIcon width={14} height={14} /> {req.acceptedBy?._id === user?._id ? "Accepté par vous" : `Accepté par ${req.acceptedBy?.name}`}</span>}
                          {req.status === "completed" && <span className="badge-completed"><CheckCircleIcon width={14} height={14} /> Terminé</span>}
                        </div>

                        <div className="request-actions">
                          {req.requestedBy?._id === user?._id && req.status === "pending" && (
                            <button className="btn-icon-delete" onClick={() => handleDelete(req._id)} disabled={submitting}>
                              <TrashIcon width={18} height={18} />
                            </button>
                          )}
                          
                          {req.status === "pending" && req.requestedBy?._id !== user?._id && (
                            <button className="btn-accept" onClick={() => handleAction(req._id, "accept")} disabled={submitting}>
                              {submitting ? "..." : "Accepter"}
                            </button>
                          )}

                          {req.status === "accepted" && req.acceptedBy?._id === user?._id && (
                            <button className="btn-complete" onClick={() => handleAction(req._id, "complete")} disabled={submitting}>
                              {submitting ? "..." : <><CheckIcon width={16} height={16} /> Marquer comme acheté</>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setIsMapExpanded(false); }}>
          <div className={`modal-content ${isMapExpanded ? 'is-expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h3>Nouvelle demande</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Produit / Article</label>
                <input 
                  type="text" 
                  required 
                  placeholder="ex: Pack d'eau, Lait..." 
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix estime (TND)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="0.00"
                    value={form.estimatedPrice}
                    onChange={(e) => setForm({ ...form, estimatedPrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Urgence</label>
                  <select 
                    value={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Lieu / Magasin (optionnel)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="ex: Monoprix, Epicerie du coin..." 
                    value={form.storeLocation}
                    onChange={(e) => setForm({ ...form, storeLocation: e.target.value })}
                    style={{ paddingRight: '40px' }}
                  />
                  <MapPinIcon 
                    width={18} 
                    height={18} 
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-soft)', opacity: 0.5 }} 
                  />
                </div>
                <div className="modal-map-container" style={{ marginTop: 12 }}>
                  <MapPreview 
                    location={form.storeLocation} 
                    isModal 
                    isExpanded={isMapExpanded}
                    setIsExpanded={setIsMapExpanded}
                    onLocationSelect={(loc) => setForm({ ...form, storeLocation: loc })} 
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowModal(false); setIsMapExpanded(false); }} disabled={submitting}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Envoi..." : "Poster la demande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;

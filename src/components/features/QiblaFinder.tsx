import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Kaaba Coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export const QiblaFinder: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [isIOS, setIsIOS] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'gps' | 'ip' | 'fallback'>('fallback');
  const [deviceCanOrient, setDeviceCanOrient] = useState(false);

  // Detect iOS on mount
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    
    // Check if orientation API exists
    if (window.DeviceOrientationEvent) {
      setDeviceCanOrient(true);
      // On Android, permission is not requested explicitly via requestPermission
      if (!ios) {
        setPermissionGranted(true);
      }
    }
  }, []);

  // Calculate Qibla Bearing
  const calculateQibla = (lat: number, lng: number) => {
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    const kaabaLatRad = KAABA_LAT * (Math.PI / 180);
    const kaabaLngRad = KAABA_LNG * (Math.PI / 180);

    const deltaLng = kaabaLngRad - lngRad;

    const y = Math.sin(deltaLng);
    const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(deltaLng);
    
    let qiblaRad = Math.atan2(y, x);
    let qiblaDeg = qiblaRad * (180 / Math.PI);
    
    // Normalize to 0-360
    qiblaDeg = (qiblaDeg + 360) % 360;
    
    setQiblaAngle(Math.round(qiblaDeg));
  };

  // Get Geolocation
  const requestLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      fetchIPLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        calculateQibla(latitude, longitude);
        setLocationMethod('gps');
        setLoadingLocation(false);
        toast.success(t('features.qibla.gpsActive'));
      },
      (error) => {
        console.warn('Geolocation error, falling back to IP:', error.message);
        fetchIPLocation();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  // IP Geolocation Fallback
  const fetchIPLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setCoords({ latitude: data.latitude, longitude: data.longitude });
          calculateQibla(data.latitude, data.longitude);
          setLocationMethod('ip');
          setLoadingLocation(false);
          toast.success(isRtl ? 'تم تحديد موقعك تقريبياً بالشبكة' : 'Approximate location set via IP');
          return;
        }
      }
    } catch (e) {
      console.error('IP Geolocation failed:', e);
    }
    
    // Hard fallback: Cairo, Egypt
    const cairoLat = 30.0444;
    const cairoLng = 31.2357;
    setCoords({ latitude: cairoLat, longitude: cairoLng });
    calculateQibla(cairoLat, cairoLng);
    setLocationMethod('fallback');
    setLoadingLocation(false);
    toast.info(t('features.qibla.fallbackCairo'));
  };

  // Load location automatically on start
  useEffect(() => {
    requestLocation();
  }, []);

  // Request Device Orientation permission (iOS specific)
  const requestOrientationPermission = async () => {
    const DeviceOrientationEventAny = window.DeviceOrientationEvent as any;
    if (
      DeviceOrientationEventAny &&
      typeof DeviceOrientationEventAny.requestPermission === 'function'
    ) {
      try {
        const permission = await DeviceOrientationEventAny.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          toast.success(isRtl ? 'تم منح إذن استخدام البوصلة' : 'Compass permission granted');
        } else {
          setPermissionGranted(false);
          toast.error(isRtl ? 'تم رفض إذن البوصلة' : 'Compass permission denied');
        }
      } catch (e) {
        console.error('Orientation permission error:', e);
        setPermissionGranted(false);
      }
    } else {
      // Android / Non-iOS
      setPermissionGranted(true);
    }
  };

  // Orientation Event Listener
  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let headingAngle = 0;
      
      // webkitCompassHeading is native iOS property
      if ((event as any).webkitCompassHeading !== undefined) {
        headingAngle = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android fallback (alpha represents rotation around z axis)
        // Correcting for Android clockwise/counterclockwise difference
        headingAngle = 360 - event.alpha;
      }

      setHeading(Math.round(headingAngle));
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    // Absolute event for some Android devices
    window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
    };
  }, [permissionGranted]);

  // Is Aligned with Qibla (tolerance 5 degrees)
  const angleDiff = qiblaAngle !== null ? (qiblaAngle - heading + 360) % 360 : 0;
  const isAligned = qiblaAngle !== null && (angleDiff < 5 || angleDiff > 355);

  // Trigger slight vibration on alignment
  useEffect(() => {
    if (isAligned && navigator.vibrate) {
      navigator.vibrate(100);
    }
  }, [isAligned]);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col items-center justify-between min-h-[460px] animate-fade-in w-full max-w-sm mx-auto">
      <div className="text-center w-full">
        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-primary" />
          {t('features.qibla.title')}
        </h3>
        
        {/* Geolocation metadata */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-4">
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          {locationMethod === 'gps' && coords && <span>{t('features.qibla.gpsActive')} ({coords.latitude.toFixed(2)}, {coords.longitude.toFixed(2)})</span>}
          {locationMethod === 'ip' && coords && <span>IP Location ({coords.latitude.toFixed(2)}, {coords.longitude.toFixed(2)})</span>}
          {locationMethod === 'fallback' && coords && <span>{t('features.qibla.fallbackCairo')} ({coords.latitude.toFixed(2)}, {coords.longitude.toFixed(2)})</span>}
          <button 
            onClick={requestLocation} 
            disabled={loadingLocation}
            className="text-primary hover:underline ml-1 mr-1 flex items-center"
          >
            <RefreshCw className={`w-3 h-3 ${loadingLocation ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compass Dial Visualization */}
      <div className="relative w-64 h-64 my-6 flex items-center justify-center">
        {/* Outer compass ring */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-muted/80 shadow-md flex items-center justify-center bg-muted/10 transition-transform duration-100 ease-out"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* Degree ticks and labels */}
          <div className="absolute top-1 font-bold text-sm text-destructive font-sans">N</div>
          <div className="absolute right-2 font-bold text-xs text-muted-foreground font-sans">E</div>
          <div className="absolute bottom-1 font-bold text-xs text-muted-foreground font-sans">S</div>
          <div className="absolute left-2 font-bold text-xs text-muted-foreground font-sans">W</div>

          {/* Diagonal guides */}
          <div className="absolute w-[94%] h-[94%] rounded-full border border-dashed border-muted-foreground/15 pointer-events-none" />
        </div>

        {/* Kaaba Arrow Dial Pointer */}
        {qiblaAngle !== null && (
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-150 ease-out pointer-events-none"
            style={{ transform: `rotate(${(qiblaAngle - heading + 360) % 360}deg)` }}
          >
            {/* Compass needle */}
            <div className="h-full flex flex-col justify-between items-center relative">
              {/* Gold needle pointing north to Kaaba */}
              <div 
                className={`w-4 h-24 bg-gradient-to-t from-amber-400 to-amber-500 rounded-full flex flex-col items-center justify-start pt-2 relative shadow-md transition-all duration-300 ${
                  isAligned ? 'scale-110 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)] !from-emerald-500 !to-green-400' : ''
                }`}
              >
                {/* Kaaba Icon shape */}
                <div className="w-5 h-5 bg-black border border-amber-300 rounded flex flex-col justify-between p-0.5 shadow relative z-10">
                  <div className="w-full h-1 bg-amber-400" />
                  <div className="w-full flex justify-center text-[6px] text-amber-200">🕋</div>
                </div>
                {/* Arrow tail */}
                <div className="w-0.5 h-16 bg-amber-400/60 mt-1" />
              </div>
              
              {/* Bottom needle tail counterweight */}
              <div className="w-2.5 h-8 bg-muted-foreground/30 rounded-full mt-auto" />
            </div>
          </div>
        )}

        {/* Center hub */}
        <div className="w-6 h-6 rounded-full bg-card border-4 border-border shadow z-10 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </div>

      {/* Target Status readout */}
      <div className="text-center w-full mt-4 px-2">
        {qiblaAngle !== null && (
          <>
            <div className="text-sm font-semibold mb-2">
              {t('features.qibla.angleLabel', { angle: qiblaAngle })}
              {deviceCanOrient && <span className="text-xs font-normal text-muted-foreground block font-sans">Device Heading: {heading}°</span>}
            </div>

            {/* iOS Sensor Button Fallback */}
            {isIOS && permissionGranted === null && (
              <Button
                onClick={requestOrientationPermission}
                size="sm"
                className="btn-pill bg-teal-600 text-white hover:bg-teal-700 rounded-full mb-3 shadow text-xs"
              >
                🔌 {t('features.qibla.allowLocation')} (البوصلة)
              </Button>
            )}

            {/* Guidance status text */}
            {isAligned ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 py-2.5 px-4 rounded-2xl text-xs md:text-sm font-semibold animate-pulse arabic-ui">
                🌟 {t('features.qibla.pointingToQibla')}
              </div>
            ) : (
              <div className="bg-muted/40 border border-border text-muted-foreground py-2 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  {deviceCanOrient && permissionGranted
                    ? t('features.qibla.alignCompass')
                    : t('features.qibla.orientationErr', { angle: qiblaAngle })}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

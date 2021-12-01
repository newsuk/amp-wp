/**
 * WordPress dependencies
 */
import { useContext, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	AMP_COMPATIBLE_PLUGINS_URL,
	SETTINGS_LINK,
} from 'amp-site-scan-notice'; // From WP inline script.

/**
 * Internal dependencies
 */
import { SiteScan } from '../../components/site-scan-context-provider';
import { User } from '../../components/user-context-provider';
import {
	AMP_ADMIN_NOTICE_TYPE_ERROR,
	AMP_ADMIN_NOTICE_TYPE_INFO,
	AMP_ADMIN_NOTICE_TYPE_SUCCESS,
	AMP_ADMIN_NOTICE_TYPE_WARNING,
	AmpAdminNotice,
} from '../../components/amp-admin-notice';
import { Loading } from '../../components/loading';
import { isExternalUrl } from '../../common/helpers/is-external-url';
import { PluginsWithAmpIncompatibility } from './plugins-with-amp-incompatibility';

// Define Plugin Suppression link.
const PLUGIN_SUPPRESSION_LINK = new URL( SETTINGS_LINK );
PLUGIN_SUPPRESSION_LINK.hash = 'plugin-suppression';

export function SiteScanNotice() {
	const {
		cancelSiteScan,
		fetchScannableUrls,
		isCancelled,
		isCompleted,
		isFailed,
		isInitializing,
		isReady,
		pluginsWithAmpIncompatibility,
		startSiteScan,
	} = useContext( SiteScan );
	const { developerToolsOption } = useContext( User );
	const userIsTechnical = useMemo( () => developerToolsOption === true, [ developerToolsOption ] );

	// Cancel scan on component unmount.
	useEffect( () => cancelSiteScan, [ cancelSiteScan ] );

	// Fetch scannable URLs on mount. Start site scan right after the component is mounted and the scanner is ready.
	useEffect( () => {
		if ( isInitializing ) {
			fetchScannableUrls();
		} else if ( isReady ) {
			startSiteScan();
		}
	}, [ fetchScannableUrls, isInitializing, isReady, startSiteScan ] );

	const commonNoticeProps = {
		className: 'amp-site-scan-notice',
		isDismissible: true,
		onDismiss: cancelSiteScan,
	};

	if ( isFailed || isCancelled ) {
		return (
			<AmpAdminNotice type={ AMP_ADMIN_NOTICE_TYPE_ERROR } { ...commonNoticeProps }>
				<p>
					{ __( 'AMP could not check your site for compatibility issues.', 'amp' ) }
				</p>
			</AmpAdminNotice>
		);
	}

	if ( isCompleted && pluginsWithAmpIncompatibility.length === 0 ) {
		return (
			<AmpAdminNotice type={ AMP_ADMIN_NOTICE_TYPE_SUCCESS } { ...commonNoticeProps }>
				<p>
					{ __( 'No AMP compatibility issues detected.', 'amp' ) }
				</p>
			</AmpAdminNotice>
		);
	}

	if ( isCompleted && pluginsWithAmpIncompatibility.length > 0 ) {
		return (
			<AmpAdminNotice type={ AMP_ADMIN_NOTICE_TYPE_WARNING } { ...commonNoticeProps }>
				<p
					dangerouslySetInnerHTML={ {
						__html: sprintf(
							/* translators: the placeholder is a link to the Plugin Suppression Settings panel. */
							__( 'AMP Plugin found validation errors. <a href="%s">Review Plugin Suppression Settings</a>', 'amp' ),
							PLUGIN_SUPPRESSION_LINK,
						),
					} }
				/>
				{ userIsTechnical && (
					<PluginsWithAmpIncompatibility pluginsWithAmpIncompatibility={ pluginsWithAmpIncompatibility } />
				) }
				<div className="amp-site-scan-notice__cta">
					<a
						href={ AMP_COMPATIBLE_PLUGINS_URL }
						className="button"
						{ ...isExternalUrl( AMP_COMPATIBLE_PLUGINS_URL ) ? { target: '_blank', rel: 'noreferrer' } : {} }
					>
						{ __( 'View AMP-Compatible Plugins', 'amp' ) }
					</a>
				</div>
			</AmpAdminNotice>
		);
	}

	return (
		<AmpAdminNotice type={ AMP_ADMIN_NOTICE_TYPE_INFO } { ...commonNoticeProps }>
			<p>
				{ __( 'Checking your site for AMP compatibility issues…', 'amp' ) }
				<Loading inline={ true } />
			</p>
		</AmpAdminNotice>
	);
}

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {SourceMapConsumer} from 'source-map';
import type {OriginalPosition} from '../../../error-overlay/react-overlay/utils/get-source-map';
import {SOURCE_MAP_ENDPOINT} from '../../../error-overlay/react-overlay/utils/source-map-endpoint';
import {LIGHT_TEXT, VERY_LIGHT_TEXT} from '../../../helpers/colors';
import {openInEditor} from '../../../helpers/open-in-editor';
import {Spacing} from '../../layout';
import {sendErrorNotification} from '../../Notifications/NotificationCenter';
import {Spinner} from '../../Spinner';
import {getOriginalLocationFromStack} from './get-stack';

// @ts-expect-error
SourceMapConsumer.initialize({
	'lib/mappings.wasm': SOURCE_MAP_ENDPOINT,
});

export const TimelineStack: React.FC<{
	stack: string;
}> = ({stack}) => {
	const [originalLocation, setOriginalLocation] =
		useState<OriginalPosition | null>(null);

	const [hovered, setHovered] = useState(false);
	const [opening, setOpening] = useState(false);

	const onClick = useCallback(async () => {
		if (!originalLocation) {
			return;
		}

		setOpening(true);
		try {
			await openInEditor({
				originalColumnNumber: originalLocation.column,
				originalFileName: originalLocation.source,
				originalFunctionName: null,
				originalLineNumber: originalLocation.line,
				originalScriptCode: null,
			});
		} catch (err) {
			sendErrorNotification((err as Error).message);
		} finally {
			setOpening(false);
		}
	}, [originalLocation]);

	useEffect(() => {
		getOriginalLocationFromStack(stack)
			.then((frame) => {
				setOriginalLocation(frame);
			})
			.catch((err) => {
				// eslint-disable-next-line no-console
				console.error('Could not get original location of Sequence', err);
			});
	}, [stack]);

	const onPointerEnter = useCallback(() => {
		setHovered(true);
	}, []);

	const onPointerLeave = useCallback(() => {
		setHovered(false);
	}, []);

	const style = useMemo((): React.CSSProperties => {
		return {
			fontSize: 12,
			color: opening ? VERY_LIGHT_TEXT : hovered ? LIGHT_TEXT : VERY_LIGHT_TEXT,
			marginLeft: 10,
			cursor: 'pointer',
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			whiteSpace: 'nowrap',
			textOverflow: 'ellipsis',
			overflow: 'hidden',
			flexShrink: 100000,
		};
	}, [hovered, opening]);

	if (!originalLocation) {
		return null;
	}

	return (
		<div
			onPointerEnter={onPointerEnter}
			onPointerLeave={onPointerLeave}
			onClick={onClick}
			style={style}
		>
			{originalLocation.source}:{originalLocation.line}
			{opening ? (
				<>
					<Spacing x={0.5} />
					<Spinner duration={0.5} size={12} />
				</>
			) : null}
		</div>
	);
};
